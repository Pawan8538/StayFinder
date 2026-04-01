const Joi = require("joi");

// Listing validation schema
const listingSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(2000),
  price: Joi.number().required().min(0),
  location: Joi.object({
    address: Joi.string(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }).required(),
  }).required(),
  images: Joi.array().items(Joi.string()).min(1).required(),
  amenities: Joi.array().items(Joi.string()),
  maxGuests: Joi.number().required().min(1),
  bedrooms: Joi.number().required().min(0),
  bathrooms: Joi.number().required().min(0),
  propertyType: Joi.string()
    .required()
    .valid("apartment", "house", "villa", "condo", "studio"),
});

// Booking validation schema
const bookingSchema = Joi.object({
  listingId: Joi.string().required(),
  checkIn: Joi.date().required().min("now"),
  checkOut: Joi.date().required().min(Joi.ref("checkIn")),
  numberOfGuests: Joi.number().required().min(1),
  specialRequests: Joi.string().max(500),
});

// Validation functions
const validateListing = (data) => {
  return listingSchema.validate(data);
};

const validateBooking = (data) => {
  return bookingSchema.validate(data);
};

module.exports = {
  validateListing,
  validateBooking,
};
