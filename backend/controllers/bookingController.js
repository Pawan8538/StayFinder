const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const mongoose = require("mongoose");
const {
  validateBooking,
  validateBookingStatus,
  formatValidationErrors,
} = require("../utils/validators");

// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Validate input using Joi
    const { error, value } = validateBooking(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Please fix the following errors to complete your booking",
        errors: formatValidationErrors(error),
      });
    }

    const { listingId, startDate, endDate, numberOfGuests } = value;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message:
          "The listing ID provided is not valid. Please select a valid property to book",
      });
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      return res.status(400).json({
        success: false,
        message:
          "Check-in date cannot be in the past. Please select a future date",
      });
    }

    if (endDateObj <= startDateObj) {
      return res.status(400).json({
        success: false,
        message:
          "Check-out date must be after the check-in date. Please adjust your dates",
      });
    }

    // Get the listing
    const listing = await Listing.findById(listingId).populate("hostId");
    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          "The property you are trying to book could not be found. It may have been removed",
      });
    }

    // Prevent host from booking their own listing
    if (listing.hostId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own property",
      });
    }

    // Check if the number of guests exceeds the maximum
    if (numberOfGuests > listing.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `This property allows a maximum of ${listing.maxGuests} guest(s). You requested ${numberOfGuests} guest(s). Please reduce the number of guests or choose a larger property`,
      });
    }

    // Check for existing bookings that overlap
    const existingBooking = await Booking.findOne({
      listingId,
      status: { $nin: ["cancelled", "rejected"] },
      $or: [
        {
          startDate: { $lte: endDateObj },
          endDate: { $gte: startDateObj },
        },
      ],
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This property is already booked for the selected dates. Please choose different dates or explore other properties",
      });
    }

    // Calculate total price
    const nights = Math.ceil(
      (endDateObj - startDateObj) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = nights * listing.price;

    // Create the booking
    const booking = new Booking({
      listingId,
      userId: req.user._id,
      hostId: listing.hostId._id,
      startDate: startDateObj,
      endDate: endDateObj,
      numberOfGuests,
      totalPrice,
      status: "pending",
    });

    await booking.save();

    // Populate the booking details
    await booking.populate([
      { path: "listingId" },
      { path: "userId", select: "name email" },
      { path: "hostId", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      message: `Booking confirmed! Your ${nights}-night stay has been reserved for ₹${totalPrice}. The host will review your request shortly`,
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message,
      );
      return res.status(400).json({
        success: false,
        message: "Please correct the following issues with your booking",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while processing your booking. Please try again later",
    });
  }
};

// Get all bookings for a user
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("listingId")
      .populate("hostId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message:
        bookings.length > 0
          ? `You have ${bookings.length} booking(s)`
          : "You haven't made any bookings yet. Start exploring properties to plan your next stay!",
      bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve your bookings at this time. Please try again later",
    });
  }
};

// Get all bookings for a host
const getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ hostId: req.user._id })
      .populate("listingId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message:
        bookings.length > 0
          ? `You have ${bookings.length} booking request(s) for your properties`
          : "No booking requests received yet for your properties",
      bookings,
    });
  } catch (error) {
    console.error("Error fetching host bookings:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve your booking requests at this time. Please try again later",
    });
  }
};

// Get a single booking
const getBooking = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "The booking ID provided is not valid. Please check and try again",
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("listingId")
      .populate("userId", "name email")
      .populate("hostId", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "This booking could not be found. It may have been removed or the link is incorrect",
      });
    }

    // Check if user is authorized to view this booking
    if (
      booking.userId._id.toString() !== req.user._id.toString() &&
      booking.hostId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this booking. Only the guest or host can access booking details",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully",
      booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve this booking at this time. Please try again later",
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "The booking ID provided is not valid. Please check and try again",
      });
    }

    // Validate status input
    const { error, value } = validateBookingStatus(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid booking status",
        errors: formatValidationErrors(error),
      });
    }

    const { status } = value;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "This booking could not be found. It may have been removed or the link is incorrect",
      });
    }

    // Only host can update booking status
    if (booking.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this booking. Only the property host can change booking status",
      });
    }

    // Prevent updating already cancelled or completed bookings
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "This booking has been cancelled and cannot be updated further",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message:
          "This booking is already marked as completed and cannot be changed",
      });
    }

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Populate for complete response
    await booking.populate([
      { path: "listingId" },
      { path: "userId", select: "name email" },
      { path: "hostId", select: "name email" },
    ]);

    const statusMessages = {
      confirmed:
        "Booking has been confirmed. The guest will be notified about the approval",
      cancelled: "Booking has been cancelled successfully",
      completed: "Booking has been marked as completed",
      pending: "Booking has been moved back to pending status",
    };

    res.status(200).json({
      success: true,
      message:
        statusMessages[status] ||
        `Booking status updated from '${previousStatus}' to '${status}'`,
      booking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while updating the booking status. Please try again later",
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "The booking ID provided is not valid. Please check and try again",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "This booking could not be found. It may have already been removed",
      });
    }

    // Check if user is authorized to cancel
    if (
      booking.userId.toString() !== req.user._id.toString() &&
      booking.hostId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to cancel this booking. Only the guest or host can cancel a booking",
      });
    }

    // Prevent cancelling already cancelled bookings
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been cancelled",
      });
    }

    // Prevent cancelling completed bookings
    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message:
          "This booking is already completed and cannot be cancelled. Please contact support if you need assistance",
      });
    }

    // Check if booking can be cancelled (not too close to check-in date)
    const checkInDate = new Date(booking.startDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkInDate - now) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilCheckIn < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Bookings cannot be cancelled within 48 hours of the check-in date. Please contact the host directly for assistance",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // Populate for complete response
    await booking.populate([
      { path: "listingId" },
      { path: "userId", select: "name email" },
      { path: "hostId", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      message:
        "Your booking has been cancelled successfully. Any applicable refund will be processed shortly",
      booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while cancelling your booking. Please try again later",
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
};
