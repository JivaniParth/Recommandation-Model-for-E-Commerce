import React from "react";
import { Heart } from "lucide-react";
import StarRating from "./StarRating";

const BookCard = ({ book, favorites, toggleFavorite, addToCart }) => {
  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="relative aspect-3/4 overflow-hidden">
        <img
          src={book.image || "https://placehold.co/300x400?text=No+Image"}
          alt={book.title || "Book"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.src = "https://placehold.co/300x400?text=No+Image";
          }}
        />
        <button
          onClick={() => toggleFavorite(book.id)}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all duration-200 ${
            favorites.includes(book.id)
              ? "bg-red-500 text-white"
              : "bg-white text-gray-600 hover:text-red-500"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              favorites.includes(book.id) ? "fill-current" : ""
            }`}
          />
        </button>
        {book.originalPrice > book.price && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Sale
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">
          {book.title || "Untitled Book"}
        </h3>
        <p className="text-gray-600 text-xs mb-2">
          {book.author || "Unknown Author"}
        </p>
        <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">
          {book.description || "No description available"}
        </p>

        <div className="mb-3">
          <StarRating rating={book.rating || 0} />
          <p className="text-xs text-gray-500 mt-1">
            {book.reviews ? book.reviews.toLocaleString() : 0} reviews
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">
              $
              {typeof book.price === "number"
                ? book.price.toFixed(2)
                : book.price || "0.00"}
            </span>
            {book.originalPrice && book.originalPrice > book.price && (
              <span className="text-sm text-gray-500 line-through">
                $
                {typeof book.originalPrice === "number"
                  ? book.originalPrice.toFixed(2)
                  : book.originalPrice}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => addToCart(book)}
          className="w-full bg-indigo-600 text-white text-sm py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 font-medium"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default BookCard;
