const Listing = require("../models/Listing");
const { validateListing } = require("../utils/validators");

// Create a new listing
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      amenities,
      maxGuests,
      bedrooms,
      bathrooms,
      propertyType,
    } = req.body;

    // Handle uploaded images
    const images = req.files
      ? req.files.map((file) => `/uploads/listings/${file.filename}`)
      : [];

    // Create new listing
    const listing = new Listing({
      title,
      description,
      price,
      location: JSON.parse(location),
      images,
      amenities: JSON.parse(amenities),
      maxGuests,
      bedrooms,
      bathrooms,
      propertyType,
      hostId: req.user._id,
    });

    await listing.save();

    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create listing",
    });
  }
};

// Get all listings with filters
const getListings = async (req, res) => {
  try {
    const {
      city,
      state,
      country,
      minPrice,
      maxPrice,
      propertyType,
      guests,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Add filters
    if (city) query["location.city"] = new RegExp(city, "i");
    if (state) query["location.state"] = new RegExp(state, "i");
    if (country) query["location.country"] = new RegExp(country, "i");
    if (propertyType) query.propertyType = propertyType;
    if (guests) query.maxGuests = { $gte: parseInt(guests) };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    const listings = await Listing.find(query)
      .populate("hostId", "name email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalListings: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single listing
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      "hostId",
      "name email",
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a listing

const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if user is the host
    if (listing.hostId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }

    // Handle existing images
    let existingImages = [];
    try {
      existingImages = req.body.existingImages
        ? JSON.parse(req.body.existingImages)
        : [];
    } catch (e) {
      return res
        .status(400)
        .json({ message: "Invalid JSON in existingImages" });
    }

    // Handle uploaded images
    const newImages = req.files
      ? req.files.map((file) => `/uploads/listings/${file.filename}`)
      : [];
    const images = [...existingImages, ...newImages];

    // Handle location and amenities parsing
    let location = {};
    let amenities = [];
    try {
      location =
        typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;
      amenities =
        typeof req.body.amenities === "string"
          ? JSON.parse(req.body.amenities)
          : req.body.amenities;
    } catch (e) {
      return res
        .status(400)
        .json({ message: "Invalid JSON in location or amenities" });
    }

    // Update listing
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        images,
        location,
        amenities,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a listing
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if user is the host
    if (listing.hostId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }

    await listing.remove();

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search listings
const searchListings = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    const searchResults = await Listing.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("hostId", "name email");

    const total = await Listing.countDocuments({ $text: { $search: query } });

    res.json({
      listings: searchResults,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalListings: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's listings
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ hostId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  searchListings,
  getUserListings,
};
