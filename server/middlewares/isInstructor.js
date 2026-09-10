import { User } from "../models/user.model.js";

const isInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Instructor only.",
      });
    }

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Authorization failed.",
    });
  }
};

export default isInstructor;