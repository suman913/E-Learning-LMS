import express from "express";
import {
  createCourse,
  editCourse,
  getCreatorCourses,
  getAllCourses,
  getSingleCourse,
  searchCourse,
  getCourseLectures,
  togglePublishCourse,
  getMyLearning,
  createLecture,
  editLecture,
  removeLecture,
  getLectureById,
} from "../controllers/course.controller.js";
import isAuthenticated from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
// here here
import isInstructor from "../middlewares/isInstructor.js";
const router = express.Router();

router.route("/create").post(isAuthenticated, isInstructor,createCourse);
router.route("/edit/:courseId").put(isAuthenticated,isInstructor, upload.single("courseThumbnail"), editCourse);
router.route("/creator-course").get(isAuthenticated,isInstructor,getCreatorCourses);
router.route("/my-learning").get(isAuthenticated, getMyLearning);
router.route("/").get(getAllCourses);
router.route("/search").get(isAuthenticated,searchCourse);
router.route("/:courseId").get(isAuthenticated,getSingleCourse);
// for lectures routes
router.route("/:courseId/lectures").get(isAuthenticated,getCourseLectures);
router.route("/:courseId/lecture").post(isAuthenticated,isInstructor, createLecture);
router.route("/lecture/:lectureId").get(isAuthenticated,getLectureById);
router.route("/:courseId/lecture/:lectureId").post(isAuthenticated,isInstructor, editLecture);
router.route("/lecture/:lectureId").delete(isAuthenticated,isInstructor, removeLecture);
router.route("/:courseId").put(isAuthenticated,isInstructor, togglePublishCourse);

export default router;
