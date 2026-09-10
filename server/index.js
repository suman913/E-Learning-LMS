import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/coursePurchase.route.js";
import courseProgress from "./routes/courseprogress.route.js";
import path from "path"


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const DIRNAME = path.resolve();

// default middleware
// Stripe webhook MUST receive the raw body
app.use(
  "/api/v1/purchase/webhook",
  express.raw({ type: "application/json" })
);

// Default middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// APIs
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/course-progress", courseProgress);

// serve static files from server
app.use(express.static(path.join(DIRNAME,"/client/dist")));
app.use("*",(_,res) => {
    res.sendFile(path.resolve(DIRNAME, "client","dist","index.html"));
})

app.listen(PORT, () => {
  connectDB();
  console.log(`Server listen at port ${PORT}`);
});
