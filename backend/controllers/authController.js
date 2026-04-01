const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  validateRegister,
  validateLogin,
  formatValidationErrors,
} = require("../utils/validators");

// Register a new user
const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Please fix the following errors to create your account",
        errors: formatValidationErrors(error),
      });
    }

    const { name, email, password, role } = value;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please use a different email or log in",
      });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );

    // Remove password from the response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Account created successfully. Welcome to StayFinder!",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please use a different email or log in",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while creating your account. Please try again later",
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid login credentials",
        errors: formatValidationErrors(error),
      });
    }

    const { email, password } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password. Please check your credentials and try again",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password. Please check your credentials and try again",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );

    // Remove password from the response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Logged in successfully. Welcome back!",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while logging you in. Please try again later",
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Your account could not be found. It may have been deleted or deactivated",
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve your profile at this time. Please try again later",
    });
  }
};

module.exports = { register, login, getCurrentUser };
