const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
} = require("../controllers/bookingController");

// All booking routes require authentication
router.use(auth);

// Host routes
router.get("/host", getHostBookings);
router.post("/:id/status", updateBookingStatus);

// User routes
router.get("/user", getUserBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.post("/:id/cancel", cancelBooking);

module.exports = router;
