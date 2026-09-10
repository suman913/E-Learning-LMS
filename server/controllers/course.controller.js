import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";

export const createCourse = async (req, res) => {
  try {
    const { title, category } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Fields are empty.",
      });
    }

    const course = await Course.create({
      courseTitle: title,
      category,
      creator: req.id,
    });

    return res.status(201).json({
      success: true,
      course,
      message: "Course created",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};
export const editCourse = async (req, res) => {
  try {
 
    const {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
    } = req.body;
    const thumbnail = req.file;

    let course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Extract public ID of the old image from the URL if it exists
    let courseThumbnail;
    if (thumbnail) {
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop().split(".")[0]; // Extracts the public ID
        await deleteMediaFromCloudinary(publicId); // Deletes the old image
      }
      // upload thumbnail on cloudinary
      courseThumbnail = await uploadMedia(req.file.path);
    }

    // const coursePrice = Number(price);
    const updatedData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail: courseThumbnail?.secure_url,
    };

    course = await Course.findByIdAndUpdate(req.params.courseId, updatedData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      course,
      message: "Course updated.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to edit course",
    });
  }
};
export const getCreatorCourses = async (req, res) => {
  try {
    const creatorId = req.id;
    const courses = await Course.find({ creator: creatorId }).populate({
      path: "lectures",
    });
    if (!courses) {
      return res.status(404).json({
        success: false,
        message: "Course Not found",
      });
    }

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get creator course",
    });
  }
};
export const getAllCourses = async (_, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl",
    });
    if (!courses) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get all courses",
    });
  }
};
export const getSingleCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator", select: "name" })
      .populate({ path: "lectures" });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if the current user is the course creator
    const isCreator =
      course.creator?._id?.toString() === userId;

    // Check if the current user has completed the purchase
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    const isPurchased = !!purchase;

    // Convert course to a normal object so we can safely
    // remove protected video information.
    const courseData = course.toObject();

    if (!isCreator && !isPurchased) {
      courseData.lectures = courseData.lectures.map((lecture) => {
        if (!lecture.isPreviewFree) {
          delete lecture.videoUrl;
          delete lecture.publicId;
        }

        return lecture;
      });
    }

    return res.status(200).json({
      success: true,
      course: courseData,
      purchased: isPurchased,
    });
  } catch (error) {
    console.log("Error getting single course:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get single course",
    });
  }
};
export const searchCourse = async (req, res) => {
  try {
    const { query = "", categories = [], sortByPrice = "" } = req.query;
     
   
    // Create the search query
    const searchCriteria = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: query, $options: "i" } },
        { subTitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    // If categories are selected, add them to the filter
    if (categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    // Define sorting order for price
    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions.coursePrice = 1; // Sort by price in ascending order
    } else if (sortByPrice === "high") {
      sortOptions.coursePrice = -1; // Sort by price in descending order
    }

    // Fetch the courses from the database
    let courses = await Course.find(searchCriteria)
      .populate({
        path: "creator",
        select: "name photoUrl",
      })
      .sort(sortOptions); // Apply sorting based on sortOptions

    // Return response
    return res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to search for courses",
    });
  }
};


export const getCourseLectures = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId).populate({
      path: "lectures",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Course creator/instructor can access their own course
    const isCreator = course.creator?.toString() === userId;

    // Check whether the current student has completed payment
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    const isPurchased = !!purchase;

    // Only the creator or a student who has purchased
    // the course can access all lectures
    if (!isCreator && !isPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to access the lectures.",
      });
    }

    return res.status(200).json({
      success: true,
      lectures: course.lectures,
    });
  } catch (error) {
    console.error("Error getting course lectures:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get course lecture.",
    });
  }
};

// export const removeCourse = async (req,res) => {

// }

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;
    const userId = req.id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Check whether the logged-in instructor owns this course
    const isOwner =
      course.creator?.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({
        message: "You are not authorized to modify this course.",
      });
    }

    // Update publish status
    course.isPublished = publish === "true";

    await course.save();

    const statusMessage = course.isPublished
      ? "published"
      : "unpublished";

    return res.status(200).json({
      message: `Course is ${statusMessage}.`,
    });
  } catch (error) {
    console.log("Error updating course publish status:", error);

    return res.status(500).json({
      message: "Failed to update the course publish status.",
    });
  }
};
export const getMyLearning = async (req, res) => {
  try {
    const userId = req.id;

    const purchases = await CoursePurchase.find({
      userId,
      status: "completed",
    }).populate({
      path: "courseId",
      populate: {
        path: "creator",
        select: "name photoUrl",
      },
    });

    const courses = purchases
      .filter((purchase) => purchase.courseId)
      .map((purchase) => purchase.courseId);

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error getting my learning courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get my learning courses.",
    });
  }
};

//? Lecture Controller start from here

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    // Validate required fields
    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        message: "Lecture title is required.",
      });
    }

    // Create a new lecture
    const lecture = await Lecture.create({ lectureTitle });

    // Find the course and push the new lecture's ID
    const course = await Course.findById(courseId);
    if (course) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(201).json({
      lecture,
      message: "Lecture created successfully.",
    });
  } catch (error) {
    console.error("Error creating lecture:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while creating the lecture. Please try again later.",
    });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { title: lectureTitle, videoInfo, isPreviewFree } = req.body;
    const { courseId, lectureId } = req.params; // Use lectureId to find the lecture you want to edit

    // Find the lecture by ID and update it
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found.",
      });
    }

    // Update lecture details
    if (lectureTitle !== undefined) {
  lecture.lectureTitle = lectureTitle;
}

if (videoInfo?.videoUrl) {
  lecture.videoUrl = videoInfo.videoUrl;
}

if (videoInfo?.publicId) {
  lecture.publicId = videoInfo.publicId;
}

if (isPreviewFree !== undefined) {
  lecture.isPreviewFree = isPreviewFree;
}

    // Save the updated lecture
    await lecture.save();

    // Ensure the course still has the lecture ID if it wasn't already added
    const course = await Course.findById(courseId);
    if (course && !course.lectures.includes(lecture._id)) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(200).json({
      lecture,
      message: "Lecture updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to edit lecture.",
    });
  }
};

export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // Find and delete the lecture
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found.",
      });
    }

    // delete lecture video from cloudinary as well
    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    // Remove the lecture reference from the associated course
    await Course.updateOne(
      { lectures: lectureId }, // Find the course that contains the lecture
      { $pull: { lectures: lectureId } } // Remove the lecture ID from the lectures array
    );
    return res.status(200).json({
      message: "Lecture removed successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to remove lecture",
    });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const userId = req.id;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    // Find the course containing this lecture
    const course = await Course.findOne({
      lectures: lectureId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course for this lecture not found",
      });
    }

    // Course creator can access all lectures
    const isCreator = course.creator?.toString() === userId;

    // Check for a completed purchase
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId: course._id,
      status: "completed",
    });

    const isPurchased = !!purchase;

    // Free preview lectures are accessible without purchase
    const isPreviewFree = lecture.isPreviewFree === true;

    if (!isCreator && !isPurchased && !isPreviewFree) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to access this lecture.",
      });
    }

    return res.status(200).json({
      success: true,
      lecture,
    });
  } catch (error) {
    console.error("Error getting lecture by id:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get lecture by id",
    });
  }
};
