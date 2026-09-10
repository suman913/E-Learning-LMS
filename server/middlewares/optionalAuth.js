import jwt from "jsonwebtoken";

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    // No token = guest user
    if (!token) {
      return next();
    }

    try {
      const decode = jwt.verify(
        token,
        process.env.SECRET_KEY
      );

      if (decode?.userId) {
        req.id = decode.userId;
      }
    } catch (error) {
      // Invalid/expired token is treated as logged-out
      console.log("Optional auth token ignored:", error.message);
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
};

export default optionalAuth;