import { CourseProgress } from "../models/courseprogress.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import mongoose from "mongoose";

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Make sure the user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    // Find the course and load all lectures
    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "lectures",
      })
      .populate({
        path: "creator",
        select: "name photoUrl",
      });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Check whether the current user is the course creator
    const isCreator =
      courseDetails.creator?._id?.toString() === userId.toString();

    // Check whether the current user has successfully purchased the course
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    const isPurchased = !!purchase;

    // Only the course creator or a successfully enrolled student
    // can access course progress.
    if (!isCreator && !isPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to access its progress.",
      });
    }

    // Find progress belonging specifically to this user and course
    const courseProgress = await CourseProgress.findOne({
      userId,
      courseId,
    });

    // No progress yet is a valid state for a newly enrolled student
    if (!courseProgress) {
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          progress: [],
          completed: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        progress: courseProgress.lecturesProgress || [],
        completed: courseProgress.completed || false,
      },
    });
  } catch (error) {
    console.error("Error fetching course progress:", error);

    // Handle invalid MongoDB ObjectId errors
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course progress.",
    });
  }
};

// Controller to update lecture progress
export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    // Validate authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Validate lecture ID
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lecture ID.",
      });
    }

    // Find the course
    const course = await Course.findById(courseId).select(
      "creator lectures"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Check if the user is the course creator
    const isCreator =
      course.creator?.toString() === userId.toString();

    // Check if the user has successfully purchased the course
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    const isPurchased = !!purchase;

    // Only creator or purchased student can update progress
    if (!isCreator && !isPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to update progress.",
      });
    }

    // Verify that this lecture belongs to this course
    const lectureBelongsToCourse = course.lectures.some(
      (id) => id.toString() === lectureId
    );

    if (!lectureBelongsToCourse) {
      return res.status(404).json({
        success: false,
        message: "Lecture does not belong to this course.",
      });
    }

    // Find existing progress for this user and course
    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    // Create progress record if it doesn't exist
    if (!courseProgress) {
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lecturesProgress: [],
      });
    }

    // Find existing lecture progress
    const lectureIndex = courseProgress.lecturesProgress.findIndex(
      (lectureProgress) =>
        lectureProgress.lectureId.toString() === lectureId
    );

    if (lectureIndex !== -1) {
      // Lecture already exists in progress
      courseProgress.lecturesProgress[lectureIndex].viewed = true;
    } else {
      // Add new lecture progress
      courseProgress.lecturesProgress.push({
        lectureId,
        viewed: true,
      });
    }

    // Get all viewed lecture IDs
    const completedLectureIds = new Set(
      courseProgress.lecturesProgress
        .filter((lectureProgress) => lectureProgress.viewed)
        .map((lectureProgress) =>
          lectureProgress.lectureId.toString()
        )
    );

    // Check whether every lecture in the course is completed
    const allLecturesCompleted =
      course.lectures.length > 0 &&
      course.lectures.every((lectureId) =>
        completedLectureIds.has(lectureId.toString())
      );

    courseProgress.completed = allLecturesCompleted;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Lecture progress updated successfully.",
      completed: courseProgress.completed,
    });
  } catch (error) {
    console.error("Error updating lecture progress:", error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid course or lecture ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update lecture progress.",
    });
  }
};

// Controller to mark the entire course as completed
export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const course = await Course.findById(courseId).select(
      "creator lectures"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const isCreator =
      course.creator?.toString() === userId.toString();

    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    const isPurchased = !!purchase;

    if (!isCreator && !isPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to complete it.",
      });
    }

    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!courseProgress) {
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lecturesProgress: [],
      });
    }

    const existingProgress = new Map(
      courseProgress.lecturesProgress.map((lectureProgress) => [
        lectureProgress.lectureId.toString(),
        lectureProgress,
      ])
    );

    course.lectures.forEach((lectureId) => {
      const id = lectureId.toString();

      if (existingProgress.has(id)) {
        existingProgress.get(id).viewed = true;
      } else {
        courseProgress.lecturesProgress.push({
          lectureId,
          viewed: true,
        });
      }
    });

    courseProgress.completed = true;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course marked as completed.",
      completed: true,
    });
  } catch (error) {
    console.error("Error marking course as completed:", error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark course as completed.",
    });
  }
};
export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const course = await Course.findById(courseId).select(
      "creator lectures"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const isCreator =
      course.creator?.toString() === userId.toString();

    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    const isPurchased = !!purchase;

    if (!isCreator && !isPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to modify its progress.",
      });
    }

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found.",
      });
    }

    courseProgress.lecturesProgress.forEach((lectureProgress) => {
      lectureProgress.viewed = false;
    });

    courseProgress.completed = false;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course marked as incomplete.",
      completed: false,
    });
  } catch (error) {
    console.error("Error marking course as incomplete:", error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark course as incomplete.",
    });
  }
};
