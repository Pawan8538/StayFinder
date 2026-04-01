const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const { validateBooking } = require("../utils/validators");

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { listingId, startDate, endDate, numberOfGuests } = req.body;

    // Validate required fields
    if (!listingId || !startDate || !endDate || !numberOfGuests) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: listingId, startDate, endDate, and numberOfGuests",
      });
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();

    if (startDateObj < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past",
      });
    }

    if (endDateObj <= startDateObj) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    // Get the listing
    const listing = await Listing.findById(listingId).populate("hostId");
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Check if the number of guests exceeds the maximum
    if (numberOfGuests > listing.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${listing.maxGuests} guests allowed for this property`,
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
      return res.status(400).json({
        success: false,
        message: "This property is already booked for the selected dates",
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
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking",
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

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings for a host
const getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ hostId: req.user._id })
      .populate("listingId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("listingId")
      .populate("userId", "name email")
      .populate("hostId", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized to view this booking
    if (
      booking.userId._id.toString() !== req.user._id.toString() &&
      booking.hostId._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only host can update booking status
    if (booking.hostId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this booking" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized to cancel
    if (
      booking.userId.toString() !== req.user._id.toString() &&
      booking.hostId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    // Check if booking can be cancelled (e.g., not too close to check-in date)
    const checkInDate = new Date(booking.startDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkInDate - now) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilCheckIn < 2) {
      return res
        .status(400)
        .json({ message: "Cannot cancel booking within 48 hours of check-in" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check availability
const checkAvailability = async (listingId, checkIn, checkOut) => {
  const listing = await Listing.findById(listingId);
  if (!listing) return false;

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  // Check if dates are valid
  if (startDate >= endDate) return false;

  // Check if dates are in the past
  if (startDate < new Date()) return false;

  // Check if dates overlap with existing bookings
  const overlappingBooking = listing.availability.some((period) => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    return (
      (startDate >= periodStart && startDate < periodEnd) ||
      (endDate > periodStart && endDate <= periodEnd) ||
      (startDate <= periodStart && endDate >= periodEnd)
    );
  });

  return !overlappingBooking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
};
