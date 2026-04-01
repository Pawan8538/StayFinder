const Joi = require("joi");

// --- Validation Schemas ---

// Auth validation schemas
const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).trim().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().required().email().trim().lowercase().messages({
    "string.empty": "Email address is required",
    "string.email": "Please provide a valid email address",
    "any.required": "Email address is required",
  }),
  password: Joi.string().required().min(6).max(128).messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("user", "host").default("user").messages({
    "any.only": "Role must be either 'user' or 'host'",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().required().email().trim().lowercase().messages({
    "string.empty": "Email address is required",
    "string.email": "Please provide a valid email address",
    "any.required": "Email address is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

// Listing validation schema
const listingSchema = Joi.object({
  title: Joi.string().required().min(3).max(100).trim().messages({
    "string.empty": "Listing title is required",
    "string.min": "Listing title must be at least 3 characters long",
    "string.max": "Listing title cannot exceed 100 characters",
    "any.required": "Listing title is required",
  }),
  description: Joi.string().required().min(10).max(2000).trim().messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters long",
    "string.max": "Description cannot exceed 2000 characters",
    "any.required": "Description is required",
  }),
  price: Joi.number().required().min(0).messages({
    "number.base": "Price must be a valid number",
    "number.min": "Price cannot be negative",
    "any.required": "Price per night is required",
  }),
  location: Joi.object({
    address: Joi.string().allow("").optional(),
    city: Joi.string().required().messages({
      "string.empty": "City is required",
      "any.required": "City is required",
    }),
    state: Joi.string().required().messages({
      "string.empty": "State is required",
      "any.required": "State is required",
    }),
    country: Joi.string().required().messages({
      "string.empty": "Country is required",
      "any.required": "Country is required",
    }),
    coordinates: Joi.object({
      lat: Joi.number().required().min(-90).max(90).messages({
        "number.base": "Latitude must be a valid number",
        "number.min": "Latitude must be between -90 and 90",
        "number.max": "Latitude must be between -90 and 90",
        "any.required": "Latitude is required",
      }),
      lng: Joi.number().required().min(-180).max(180).messages({
        "number.base": "Longitude must be a valid number",
        "number.min": "Longitude must be between -180 and 180",
        "number.max": "Longitude must be between -180 and 180",
        "any.required": "Longitude is required",
      }),
    }).required().messages({
      "any.required": "Location coordinates are required",
    }),
  }).required().messages({
    "any.required": "Location details are required",
  }),
  images: Joi.array().items(Joi.string()).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  maxGuests: Joi.number().required().integer().min(1).messages({
    "number.base": "Maximum guests must be a valid number",
    "number.integer": "Maximum guests must be a whole number",
    "number.min": "At least 1 guest must be allowed",
    "any.required": "Maximum number of guests is required",
  }),
  bedrooms: Joi.number().required().integer().min(0).messages({
    "number.base": "Bedrooms must be a valid number",
    "number.integer": "Bedrooms must be a whole number",
    "number.min": "Bedrooms cannot be negative",
    "any.required": "Number of bedrooms is required",
  }),
  bathrooms: Joi.number().required().integer().min(0).messages({
    "number.base": "Bathrooms must be a valid number",
    "number.integer": "Bathrooms must be a whole number",
    "number.min": "Bathrooms cannot be negative",
    "any.required": "Number of bathrooms is required",
  }),
  propertyType: Joi.string()
    .required()
    .valid("apartment", "house", "villa", "condo", "studio")
    .messages({
      "string.empty": "Property type is required",
      "any.only":
        "Property type must be one of: apartment, house, villa, condo, or studio",
      "any.required": "Property type is required",
    }),
});

// Booking validation schema
const bookingSchema = Joi.object({
  listingId: Joi.string().required().messages({
    "string.empty": "Listing ID is required to create a booking",
    "any.required": "Listing ID is required to create a booking",
  }),
  startDate: Joi.date().required().messages({
    "date.base": "Check-in date must be a valid date",
    "any.required": "Check-in date is required",
  }),
  endDate: Joi.date().required().messages({
    "date.base": "Check-out date must be a valid date",
    "any.required": "Check-out date is required",
  }),
  numberOfGuests: Joi.number().required().integer().min(1).messages({
    "number.base": "Number of guests must be a valid number",
    "number.integer": "Number of guests must be a whole number",
    "number.min": "At least 1 guest is required",
    "any.required": "Number of guests is required",
  }),
});

// Booking status update validation
const bookingStatusSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid("pending", "confirmed", "cancelled", "completed")
    .messages({
      "string.empty": "Booking status is required",
      "any.only":
        "Status must be one of: pending, confirmed, cancelled, or completed",
      "any.required": "Booking status is required",
    }),
});

// --- Validation Functions ---

const validateRegister = (data) => {
  return registerSchema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

const validateListing = (data) => {
  return listingSchema.validate(data, { abortEarly: false });
};

const validateBooking = (data) => {
  return bookingSchema.validate(data, { abortEarly: false });
};

const validateBookingStatus = (data) => {
  return bookingStatusSchema.validate(data, { abortEarly: false });
};

/**
 * Formats Joi validation errors into a user-friendly response object.
 * Returns an array of { field, message } objects.
 */
const formatValidationErrors = (joiError) => {
  if (!joiError || !joiError.details) return [];
  return joiError.details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message,
  }));
};

module.exports = {
  validateRegister,
  validateLogin,
  validateListing,
  validateBooking,
  validateBookingStatus,
  formatValidationErrors,
};
