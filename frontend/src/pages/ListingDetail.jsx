import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getImageUrl } from "../utils/imageUtils";
import API from "../utils/api";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ListingDetail = () => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingDates, setBookingDates] = useState({
    startDate: "",
    endDate: "",
    numberOfGuests: 1,
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await API.get(`/listings/${id}`);
        setListing(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch listing details",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingDates((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");

    setBookingError("");
    setBookingLoading(true);

    try {
      const response = await API.post("/bookings", {
        listingId: id,
        ...bookingDates,
        numberOfGuests: parseInt(bookingDates.numberOfGuests),
      });

      if (response.data.success) {
        navigate("/my-bookings");
      } else {
        throw new Error(response.data.message || "Failed to create booking");
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message || "Failed to create booking",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const lat = Number(listing?.location?.coordinates?.lat);
  const lng = Number(listing?.location?.coordinates?.lng);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Listing not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {listing.title}
        </h1>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {listing.images?.map((img, i) => (
            <img
              key={i}
              src={getImageUrl(img)}
              alt={`Listing ${i + 1}`}
              className="w-full h-80 object-cover rounded-xl shadow"
            />
          ))}
        </div>

        {/* Location + Host */}
        <div className="mb-10">
          <p className="text-gray-600 text-base">
            {listing.location.address}, {listing.location.city},{" "}
            {listing.location.state}, {listing.location.country}
          </p>
        </div>
        <div className="mt-4 mb-6">
          <p className="text-lg font-semibold text-gray-800">
            Hosted by <span className="font-bold">{listing.hostId?.name}</span>
          </p>
        </div>
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Side */}
          <div className="md:col-span-2 space-y-8">
            {/* Price */}
            <div className="text-2xl font-semibold text-gray-900">
              ${listing.price}{" "}
              <span className="text-base font-normal text-gray-600">
                / night
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-2">About this place</h2>
              <p className="text-gray-700">{listing.description}</p>
            </div>

            {/* Property Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="font-medium text-gray-800">{listing.bedrooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="font-medium text-gray-800">{listing.bathrooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Guests</p>
                <p className="font-medium text-gray-800">{listing.maxGuests}</p>
              </div>
            </div>

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {listing.amenities.map((a, i) => (
                    <div key={i} className="text-gray-700">
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {lat && lng && (
              <div className="mt-10">
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="h-[300px] w-full rounded-xl border-2 border-gray-300 overflow-hidden">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={13}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]}>
                      <Popup>{listing.title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Booking Card (unchanged) */}
          <div className="md:col-span-1">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Book your stay
              </h2>
              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-400 text-red-700 rounded">
                  {bookingError}
                </div>
              )}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Check-in
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={bookingDates.startDate}
                    onChange={handleBookingChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Check-out
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={bookingDates.endDate}
                    onChange={handleBookingChange}
                    min={
                      bookingDates.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    name="numberOfGuests"
                    value={bookingDates.numberOfGuests}
                    onChange={handleBookingChange}
                    min="1"
                    max={listing.maxGuests}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {bookingLoading ? "Booking..." : "Book Now"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
