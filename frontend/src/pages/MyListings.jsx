import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import { getImageUrl } from "../utils/imageUtils";

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/listings/user/listings");
      setListings(response.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err.response?.data?.message || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      await API.delete(`/listings/${id}`);
      setListings(listings.filter((listing) => listing._id !== id));
    } catch (err) {
      console.error("Error deleting listing:", err);
      setError(err.response?.data?.message || "Failed to delete listing");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
        <Link
          to="/create-listing"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No listings yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first listing to start hosting!
          </p>
          <Link
            to="/create-listing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {listing.images && listing.images.length > 0 ? (
                <img
                src={getImageUrl(listing.images[0])}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {listing.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {listing.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    ${listing.price}/night
                  </span>
                  <div className="space-x-2">
                    <Link
                      to={`/listings/${listing._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/listings/${listing._id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(listing._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
