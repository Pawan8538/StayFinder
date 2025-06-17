import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../utils/api";
import { getImageUrl } from "../utils/imageUtils";

const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = new URLSearchParams(useLocation().search).get("query");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await API.get(
          `/listings/search?query=${encodeURIComponent(query)}`,
        );
        setResults(response.data.listings);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch search results");
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchResults();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">
        Search Results for "{query}"
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((property) => (
            <div
              key={property._id}
              onClick={() => navigate(`/listings/${property._id}`)}
              className="cursor-pointer bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={getImageUrl(property.images[0])}
                alt={property.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {property.title}
                </h3>
                <p className="text-gray-600">
                  {property.location.city}, {property.location.country}
                </p>
                <p className="text-blue-600 font-bold mt-2">
                  ${property.price} / night
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
