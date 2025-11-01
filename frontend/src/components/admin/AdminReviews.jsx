import React, { useState, useEffect, useCallback } from "react";
import { Star, Trash2, Search, Filter } from "lucide-react";
import apiService from "../apiService";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.adminGetReviews({
        page: pagination.page,
        per_page: 20,
      });
      if (response.success) {
        setReviews(response.reviews);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }
    try {
      await apiService.adminDeleteReview(reviewId);
      alert("Review deleted successfully!");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review.");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter reviews by search and rating
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      !searchTerm ||
      review.user?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      review.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      !ratingFilter || review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesRating;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Star className="w-8 h-8 mr-3 text-indigo-600" />
          Reviews Management
        </h1>
        <div className="text-sm text-gray-600">
          Total Reviews: {pagination.total}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Rating Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            {(searchTerm || ratingFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setRatingFilter("");
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm || ratingFilter
              ? "No reviews match your filters"
              : "No reviews found"}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* User Avatar */}
                      <img
                        src={
                          review.user?.avatar ||
                          `https://ui-avatars.com/api/?name=${review.user?.firstName}+${review.user?.lastName}&background=6366f1&color=fff&size=40`
                        }
                        alt={`${review.user?.firstName} ${review.user?.lastName}`}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />

                      {/* Review Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {review.user?.firstName} {review.user?.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {review.user?.email}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>

                        {/* Book Info */}
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            Book ID:{" "}
                            <span className="font-medium">{review.bookId}</span>
                          </p>
                        </div>

                        {/* Review Text */}
                        {review.comment && (
                          <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        )}

                        {/* Review Date */}
                        <p className="text-xs text-gray-500">
                          {formatDate(review.reviewDate)}
                        </p>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Delete Review"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {pagination.page} of {pagination.pages} (
                {pagination.total} total reviews)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
