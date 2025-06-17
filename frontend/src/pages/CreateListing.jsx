import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useDebounce } from "../utils/debounce";
import axios from "axios";

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: {
      address: "",
      city: "",
      state: "",
      country: "",
      coordinates: {
        lat: "",
        lng: "",
      },
    },
    images: [],
    amenities: [],
    maxGuests: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
  });

  // Fix default marker icon issue with Leaflet + Webpack
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });


  const debouncedAddress = useDebounce(formData.location.address, 500);

  const nominatimHeaders = {
    headers: {
      "User-Agent": "StayFinderApp/1.0 (your-email@example.com)",
    },
  };

useEffect(() => {
  const fetchCoords = async () => {
    if (debouncedAddress.length < 5) return;
    try {
      const res = await axios.get(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}`,
  nominatimHeaders
);
      if (res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat, lng: lon },
          },
        }));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };
  fetchCoords();
}, [debouncedAddress]);


const LocationPicker = ({ setFormData }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          nominatimHeaders
        );        
        const address = res.data.address || {};
        setFormData((prev) => ({
          ...prev,
          location: {
            address: res.data.display_name || "",
            city: address.city || address.town || address.village || "",
            state: address.state || "",
            country: address.country || "",
            coordinates: { lat, lng },
          },
        }));
      } catch (err) {
        console.error("Reverse geocoding failed", err);
      }
    },
  });
  return null;
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();

      // Append basic fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append(
        "location",
        JSON.stringify({
          ...formData.location,
          coordinates: {
            lat: parseFloat(formData.location.coordinates.lat),
            lng: parseFloat(formData.location.coordinates.lng),
          },
        }),
      );
      formDataToSend.append("amenities", JSON.stringify(formData.amenities));
      formDataToSend.append("maxGuests", formData.maxGuests);
      formDataToSend.append("bedrooms", formData.bedrooms);
      formDataToSend.append("bathrooms", formData.bathrooms);
      formDataToSend.append("propertyType", formData.propertyType);

      // Append images
      formData.images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const response = await API.post("/listings", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        navigate("/my-listings");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "host") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">Only hosts can create listings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price per night
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              placeholder="City"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              name="location.state"
              value={formData.location.state}
              onChange={handleChange}
              placeholder="State"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              name="location.country"
              value={formData.location.country}
              onChange={handleChange}
              placeholder="Country"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Location on Map
            </label>
            <div className="h-64 w-full rounded overflow-hidden">
              <MapContainer
                center={[
                  parseFloat(formData.location.coordinates.lat || "20.5937"),
                  parseFloat(formData.location.coordinates.lng || "78.9629"),
                ]}
                zoom={5}
                scrollWheelZoom={true}
                dragging={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <LocationPicker setFormData={setFormData} />
                {formData.location.coordinates.lat &&
                  formData.location.coordinates.lng && (
                    <Marker
                      position={[
                        parseFloat(formData.location.coordinates.lat),
                        parseFloat(formData.location.coordinates.lng),
                      ]}
                    />
                  )}
              </MapContainer>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Click on the map to select the location.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="mt-1 block w-full"
          />
          <div className="mt-2 grid grid-cols-3 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Property Details
          </label>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              name="maxGuests"
              value={formData.maxGuests}
              onChange={handleChange}
              placeholder="Max Guests"
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              placeholder="Bedrooms"
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              placeholder="Bathrooms"
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Property Type
          </label>
          <select
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a type</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="cabin">Cabin</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amenities
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              "wifi",
              "parking",
              "pool",
              "kitchen",
              "airConditioning",
              "heating",
              "tv",
              "washer",
            ].map((amenity) => (
              <label key={amenity} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={(e) => {
                    const newAmenities = e.target.checked
                      ? [...formData.amenities, amenity]
                      : formData.amenities.filter((a) => a !== amenity);
                    setFormData((prev) => ({
                      ...prev,
                      amenities: newAmenities,
                    }));
                  }}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {amenity.charAt(0).toUpperCase() +
                    amenity.slice(1).replace(/([A-Z])/g, " $1")}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListing;
