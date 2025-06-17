import React, { useEffect, useState } from "react";
import API from "../utils/api";

const HostDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHostBookings = async () => {
    try {
      const res = await API.get("/bookings/host", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBookings(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await API.post(
        `/bookings/${bookingId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b)),
      );
    } catch (err) {
      alert("Failed to update status");
      console.error(err.message);
    }
  };

  const handleRemoveCard = (id) => {
    setBookings((prev) => prev.filter((b) => b._id !== id));
  };

  useEffect(() => {
    fetchHostBookings();
  }, []);

  if (loading) return <div className="p-6">Loading bookings...</div>;
  if (bookings.length === 0)
    return <div className="p-6">No bookings found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Host Dashboard</h1>

      {bookings.map((booking) => (
        <div
          key={booking._id}
          className="relative bg-white shadow rounded-xl p-4 mb-4 border border-gray-300"
        >
          {/* ❌ Close Button */}
          <button
            onClick={() => handleRemoveCard(booking._id)}
            className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
            title="Remove"
          >
            &times;
          </button>

          <h2 className="text-xl font-semibold mb-1">
            {booking.listingId?.title || "Untitled Listing"}
          </h2>
          <p className="mb-1">Guest: {booking.userId?.name}</p>
          <p className="mb-1">
            From: {new Date(booking.startDate).toLocaleDateString()}
          </p>
          <p className="mb-1">
            To: {new Date(booking.endDate).toLocaleDateString()}
          </p>
          <p className="mb-1">Total: ₹{booking.totalPrice}</p>
          <p className="mb-2">
            Status: <strong>{booking.status}</strong>
          </p>

          {booking.status?.toLowerCase() === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate(booking._id, "confirmed")}
                className="bg-green-600 text-white px-4 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => handleStatusUpdate(booking._id, "rejected")}
                className="bg-red-600 text-white px-4 py-1 rounded"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HostDashboard;
