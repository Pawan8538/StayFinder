const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    location: {
      address: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
    },
    images: [
      {
        type: String,
      },
    ],
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amenities: [
      {
        type: String,
      },
    ],
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    propertyType: {
      type: String,
      required: true,
      enum: ["apartment", "house", "villa", "condo", "studio"],
    },
  },
  { timestamps: true },
);

listingSchema.index({
  title: "text",
  description: "text",
  "location.city": "text",
  "location.country": "text",
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
