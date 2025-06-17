const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  searchListings,
  getUserListings,
} = require("../controllers/listingController");

// Public routes
router.get("/", getListings);
router.get("/search", searchListings);

// Protected routes
router.use(auth);
router.post("/", upload.array("images", 5), createListing);
router.get("/user/listings", getUserListings);

// Parameterized routes (must come after specific routes)
router.get("/:id", getListing);
router.put("/:id", upload.array("images", 5), updateListing);
router.delete("/:id", deleteListing);

module.exports = router;
