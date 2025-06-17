import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import AuthContext from "../contexts/AuthContext";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await API.get(
          "/bookings/user",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setBookings(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(err.response?.data?.message || "Failed to fetch bookings");
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await API.post(
          `/bookings/${bookingId}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (response.data.success) {
          setBookings(
            bookings.map((booking) =>
              booking._id === bookingId
                ? { ...booking, status: "cancelled" }
                : booking,
            ),
          );
        } else {
          throw new Error(response.data.message || "Failed to cancel booking");
        }
      } catch (err) {
        console.error("Error cancelling booking:", err);
        alert(
          err.response?.data?.message ||
            "Failed to cancel booking. Please try again.",
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              You haven't made any bookings yet.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="relative bg-white shadow rounded-lg overflow-hidden"
              >
                {/* X (Remove) Button */}
                <button
                  onClick={() =>
                    setBookings((prev) =>
                      prev.filter((b) => b._id !== booking._id),
                    )
                  }
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-xl font-bold focus:outline-none"
                  title="Remove card"
                >
                  ×
                </button>

                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {booking.listingId?.title || "Unknown Listing"}
                      </h2>
                      <p className="text-gray-600">
                        {booking.listingId?.location?.city || "Unknown City"},{" "}
                        {booking.listingId?.location?.country ||
                          "Unknown Country"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${booking.totalPrice}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.startDate).toLocaleDateString()} -{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p
                        className={`text-sm font-medium ${
                          booking.status === "confirmed"
                            ? "text-green-600"
                            : booking.status === "cancelled"
                              ? "text-red-600"
                              : booking.status === "pending"
                                ? "text-yellow-600"
                                : "text-gray-600"
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {/* Cancel Booking Button */}
                      {booking.status === "pending" && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel Booking
                        </button>
                      )}

                      {/* Pay Host Button */}
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => alert("Handle payment to host")}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          Pay Host
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
