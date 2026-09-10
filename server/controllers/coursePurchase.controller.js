import mongoose from "mongoose";
import Stripe from "stripe";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import {User} from "../models/user.model.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is missing.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Only published courses can be purchased
    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: "This course is not available for purchase.",
      });
    }

    // Prevent duplicate completed purchases
    const existingPurchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "You have already purchased this course.",
      });
    }

    const coursePrice = Number(course.coursePrice);

    if (!Number.isFinite(coursePrice) || coursePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price.",
      });
    }

    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: coursePrice,
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: course.courseTitle,
              ...(course.courseThumbnail
                ? { images: [course.courseThumbnail] }
                : {}),
            },
            unit_amount: Math.round(coursePrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/course-progress/${courseId}`,
      cancel_url: `${process.env.FRONTEND_URL}/course-details/${courseId}`,
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString(),
      },
    });

    if (!session.url) {
      return res.status(400).json({
        success: false,
        message: "Error while creating session.",
      });
    }

    newPurchase.paymentIntentId = session.id;
    await newPurchase.save();

    return res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const stripeWebhook = async (req, res) => {
  let event;

  try {
    const signature = req.headers["stripe-signature"];
    const secret = process.env.WEBHOOK_ENDPOINT_SECRET;

    if (!signature) {
      return res.status(400).send("Missing Stripe signature");
    }

    if (!secret) {
      return res.status(500).send("Webhook secret is not configured");
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      secret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object;

      const purchase = await CoursePurchase.findOne({
        paymentIntentId: session.id,
      }).populate({
        path: "courseId",
      });

      if (!purchase) {
        console.error(
          "Purchase not found for Stripe session:",
          session.id
        );
        return res.status(404).json({
          message: "Purchase not found",
        });
      }

      // Prevent duplicate processing
      if (purchase.status === "completed") {
        return res.status(200).send();
      }

      // Stripe amount is in paise
      if (session.amount_total) {
        purchase.amount = session.amount_total / 100;
      }

      purchase.status = "completed";

      await purchase.save();

      // Enroll the student in the course
      await User.findByIdAndUpdate(
        purchase.userId,
        {
          $addToSet: {
            enrolledCourses: purchase.courseId._id,
          },
        }
      );

      // Add student to course's enrolledStudents
      await Course.findByIdAndUpdate(
        purchase.courseId._id,
        {
          $addToSet: {
            enrolledStudents: purchase.userId,
          },
        }
      );

      console.log(
        `Payment completed. User ${purchase.userId} enrolled in course ${purchase.courseId._id}`
      );
    } catch (error) {
      console.error("Error handling checkout.session.completed:", error);

      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }

  return res.status(200).send();
};

export const getCourseDetailsWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id || null;

    const course = await Course.findById(courseId)
      .populate({
        path: "creator",
        select: "name photoUrl",
      })
      .populate({
        path: "lectures",
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let purchased = false;
    let isCreator = false;

    if (userId) {
      const purchase = await CoursePurchase.findOne({
        userId,
        courseId,
        status: "completed",
      });

      purchased = !!purchase;

      isCreator =
        course.creator?._id?.toString() === userId.toString();
    }

    const courseData = course.toObject();

    // Unauthenticated/unpurchased users can see course information
    // and preview lectures, but not protected lecture video data.
    if (!purchased && !isCreator) {
  courseData.lectures = courseData.lectures.map(
    (lecture, index) => {
      // First lecture is the public preview
      const isPreviewLecture =
        index === 0 || lecture.isPreviewFree === true;

      if (!isPreviewLecture) {
        delete lecture.videoUrl;
        delete lecture.publicId;
      }

      return lecture;
    }
  );
}

    return res.status(200).json({
      success: true,
      course: courseData,
      purchased,
    });
  } catch (error) {
    console.error(
      "Error fetching course details with purchase status:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error fetching course details",
    });
  }
};
export const getAllPurchasedCourse = async (req, res) => {
  try {
    // const adminId = req.id;
    const purchasedCourse = await CoursePurchase.find({status: "completed"}).populate("courseId");
    
    if(purchasedCourse.length===0){
      return res.status(200).json({
        purchasedCourse:[]
      })
    }
    return res.status(200).json({
      purchasedCourse
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

