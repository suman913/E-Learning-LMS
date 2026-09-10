import express from "express";
import {
  createCheckoutSession,
  getAllPurchasedCourse,
  getCourseDetailsWithPurchaseStatus,
  stripeWebhook,
} from "../controllers/coursePurchase.controller.js";
import isAuthenticated from "../middlewares/auth.js";
import optionalAuth from "../middlewares/optionalAuth.js";

const router = express.Router();

router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, createCheckoutSession);
router
  .route("/webhook")
  .post(stripeWebhook);

router
  .route("/courses/:courseId/details-with-status")
  .get(optionalAuth, getCourseDetailsWithPurchaseStatus);

router
.route("/")
.get(isAuthenticated, getAllPurchasedCourse);

export default router;
