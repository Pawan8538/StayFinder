import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import { getImageUrl } from "../utils/imageUtils";

const PropertyCard = ({ property }) => {
  return (
    <Link
      to={`/listings/${property._id}`}
      className="block transform hover:scale-105 transition duration-300"
    >
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden transition">
        <div className="relative h-52">
          <img
            src={getImageUrl(property.images[0])}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900">
              {property.title}
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              ${property.price}/night
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {property.location.city}, {property.location.country}
          </p>

          <div className="mt-2 flex items-center text-gray-500 text-sm space-x-3">
            <span>{property.bedrooms} beds</span>
            <span>•</span>
            <span>{property.bathrooms} baths</span>
            <span>•</span>
            <span>{property.maxGuests} guests</span>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-700">Type:</span>{" "}
              {property.propertyType}
            </p>
            {property.hostId?.name && (
              <p className="mt-1">
                <span className="font-medium text-gray-700">Host:</span>{" "}
                {property.hostId.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await API.get("/listings");
        setListings(response.data.listings || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch listings. Please try again later.");
        setLoading(false);
        console.error("Error fetching listings:", err);
      }
    };

    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
            alt="Hero"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow">
              Discover unique places to stay around the world
            </p>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
          Featured Properties
        </h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No properties found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {listings.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
