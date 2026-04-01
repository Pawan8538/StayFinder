const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication is required to access this resource. Please log in and try again",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format. Please use 'Bearer <token>' format",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is missing. Please log in and try again",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret",
      );
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message:
            "Your session has expired. Please log in again to continue",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message:
            "Your authentication token is invalid. Please log in again",
        });
      }

      return res.status(401).json({
        success: false,
        message:
          "Authentication failed. Please log in again",
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "The account associated with this session could not be found. It may have been deleted or deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during authentication. Please try again later",
    });
  }
};

module.exports = { auth };
