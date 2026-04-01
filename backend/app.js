const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to StayFinder API",
    version: "1.0.0",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist. Please check the API documentation for available routes`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // Handle JSON parse errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message:
        "The request body contains invalid JSON. Please check your data format and try again",
    });
  }

  // Handle payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message:
        "The request payload is too large. Please reduce the size of your data and try again",
    });
  }

  // Handle Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message:
        "The uploaded file exceeds the maximum size of 5MB. Please use a smaller file",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message:
        "Too many files uploaded. You can upload a maximum of 5 images per listing",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message:
        "Unexpected file field. Please use the correct field name for uploading images",
    });
  }

  if (err.message === "Only image files are allowed!") {
    return res.status(400).json({
      success: false,
      message:
        "Only image files (JPG, JPEG, PNG, GIF) are allowed. Please upload a valid image file",
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message:
        "The provided ID is not valid. Please check the URL and try again",
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed. Please correct the following errors",
      errors: messages,
    });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists. Please use a different value`,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Something went wrong on our end. Please try again later. If the issue persists, contact support"
        : err.message || "An error occurred while processing your request",
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
