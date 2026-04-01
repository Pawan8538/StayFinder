const Listing = require("../models/Listing");
const {
  validateListing,
  formatValidationErrors,
} = require("../utils/validators");
const mongoose = require("mongoose");

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

    // Parse JSON fields safely
    let parsedLocation, parsedAmenities;
    try {
      parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message:
          "Location data is not in a valid format. Please provide valid location details",
      });
    }

    try {
      parsedAmenities =
        typeof amenities === "string" ? JSON.parse(amenities) : amenities;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message:
          "Amenities data is not in a valid format. Please provide a valid list of amenities",
      });
    }

    // Validate input using Joi
    const dataToValidate = {
      title,
      description,
      price: Number(price),
      location: parsedLocation,
      amenities: parsedAmenities,
      maxGuests: Number(maxGuests),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      propertyType,
    };

    const { error } = validateListing(dataToValidate);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Please fix the following errors before creating the listing",
        errors: formatValidationErrors(error),
      });
    }

    // Handle uploaded images
    const images = req.files
      ? req.files.map((file) => `/uploads/listings/${file.filename}`)
      : [];

    // Create new listing
    const listing = new Listing({
      ...dataToValidate,
      images,
      hostId: req.user._id,
    });

    await listing.save();

    res.status(201).json({
      success: true,
      message: "Your listing has been created successfully and is now live!",
      listing,
    });
  } catch (error) {
    console.error("Error creating listing:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message,
      );
      return res.status(400).json({
        success: false,
        message: "Please correct the following issues with your listing",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while creating your listing. Please try again later",
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

    // Validate pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Page number must be a positive integer",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a number between 1 and 100",
      });
    }

    // Validate price range
    if (minPrice && isNaN(Number(minPrice))) {
      return res.status(400).json({
        success: false,
        message: "Minimum price must be a valid number",
      });
    }

    if (maxPrice && isNaN(Number(maxPrice))) {
      return res.status(400).json({
        success: false,
        message: "Maximum price must be a valid number",
      });
    }

    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot be greater than maximum price",
      });
    }

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
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      message:
        total > 0
          ? `Found ${total} listing(s) matching your criteria`
          : "No listings found matching your search criteria. Try adjusting your filters",
      listings,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalListings: total,
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve listings at this time. Please try again later",
    });
  }
};

// Get a single listing
const getListing = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "The listing ID provided is not valid. Please check the URL and try again",
      });
    }

    const listing = await Listing.findById(req.params.id).populate(
      "hostId",
      "name email",
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          "This listing could not be found. It may have been removed or the link is incorrect",
      });
    }

    res.status(200).json({
      success: true,
      message: "Listing details retrieved successfully",
      listing,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve this listing at this time. Please try again later",
    });
  }
};

// Update a listing
const updateListing = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "The listing ID provided is not valid. Please check the URL and try again",
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          "This listing could not be found. It may have been removed or the link is incorrect",
      });
    }

    // Check if user is the host
    if (listing.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this listing. Only the property host can make changes",
      });
    }

    // Handle existing images
    let existingImages = [];
    try {
      existingImages = req.body.existingImages
        ? JSON.parse(req.body.existingImages)
        : [];
    } catch (e) {
      return res.status(400).json({
        success: false,
        message:
          "Existing images data is not in a valid format. Please try again",
      });
    }

    // Handle uploaded images
    const newImages = req.files
      ? req.files.map((file) => `/uploads/listings/${file.filename}`)
      : [];
    const images = [...existingImages, ...newImages];

    // Handle location and amenities parsing
    let location, amenities;
    try {
      location =
        typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message:
          "Location data is not in a valid format. Please provide valid location details",
      });
    }

    try {
      amenities =
        typeof req.body.amenities === "string"
          ? JSON.parse(req.body.amenities)
          : req.body.amenities;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message:
          "Amenities data is not in a valid format. Please provide a valid list of amenities",
      });
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
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Your listing has been updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error updating listing:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message,
      );
      return res.status(400).json({
        success: false,
        message: "Please correct the following issues with your listing",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while updating your listing. Please try again later",
    });
  }
};

// Delete a listing
const deleteListing = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "The listing ID provided is not valid. Please check the URL and try again",
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          "This listing could not be found. It may have already been removed",
      });
    }

    // Check if user is the host
    if (listing.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete this listing. Only the property host can remove it",
      });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Your listing has been removed successfully",
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({
      success: false,
      message:
        "We encountered an issue while removing your listing. Please try again later",
    });
  }
};

// Search listings
const searchListings = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a search term to find listings (e.g., city name, property type)",
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Page number must be a positive integer",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a number between 1 and 100",
      });
    }

    const searchResults = await Listing.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("hostId", "name email");

    const total = await Listing.countDocuments({ $text: { $search: query } });

    res.status(200).json({
      success: true,
      message:
        total > 0
          ? `Found ${total} listing(s) matching "${query}"`
          : `No listings found matching "${query}". Try using different keywords`,
      listings: searchResults,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalListings: total,
    });
  } catch (error) {
    console.error("Error searching listings:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not complete your search at this time. Please try again later",
    });
  }
};

// Get user's listings
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ hostId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message:
        listings.length > 0
          ? `You have ${listings.length} listing(s)`
          : "You haven't created any listings yet. Start by adding your first property!",
      listings,
    });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).json({
      success: false,
      message:
        "We could not retrieve your listings at this time. Please try again later",
    });
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
