// frontend/src/Components/BookStore.jsx
// Updated version with Recommendations Integration

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import BooksGrid from "./BooksGrid";
import ShoppingCartSidebar from "./ShoppingCartSidebar";
import CheckoutPage from "./CheckoutPage";
import AuthModal from "./AuthModal";
import UserProfileModal from "./UserProfileModal";
import OrdersModal from "./OrdersModal";
import RecommendationsSection from "./RecommendationsSection";
import { useAuth } from "./useAuth";
import apiService from "./apiService";

const BookStore = () => {
  const { isAuthenticated, isInitializing, user } = useAuth(); // Added user

  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch books from API
  useEffect(() => {
    const fetchBooksAndCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          search: searchTerm,
          sort: sortBy,
        };

        if (selectedCategory && selectedCategory !== "all") {
          params.category = selectedCategory;
        }
        if (selectedAuthor) {
          params.author = selectedAuthor;
        }
        if (selectedPublisher) {
          params.publisher = selectedPublisher;
        }

        const [booksResponse, categoriesResponse] = await Promise.all([
          apiService.getBooks(params),
          apiService.getCategories(),
        ]);

        if (booksResponse && booksResponse.success) {
          setBooks(booksResponse.books);
          setFilteredBooks(booksResponse.books);
        } else {
          // This branch should only be hit if API returns 200 with {success:false}
          throw new Error(
            booksResponse.error ||
              "Failed to retrieve book data (Invalid response format)."
          );
        }

        if (categoriesResponse && categoriesResponse.success) {
          setCategories(categoriesResponse.categories);
        } else {
          throw new Error(
            categoriesResponse.error ||
              "Failed to retrieve category data (Invalid response format)."
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error.message ||
            String(error) ||
            "A critical, uncaught error occurred during initial data loading."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!isInitializing) {
      fetchBooksAndCategories();
    }
  }, [
    searchTerm,
    selectedCategory,
    selectedAuthor,
    selectedPublisher,
    sortBy,
    isInitializing,
  ]);

  // Fetch cart when user is authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (isAuthenticated) {
        try {
          // Use the protected API service call
          const response = await apiService.getCart();
          if (response.success) {
            setCart(response.cart);
          } else {
            // Although apiService.handleResponse should catch this,
            // this catch block is the final safety net.
            throw new Error(response.error || "Failed to load cart data.");
          }
        } catch (error) {
          // If it's a known authentication error (like invalid token), just log it
          // and clear cart locally without displaying a huge error.
          console.error(
            "Error fetching cart (likely token issue):",
            error.message
          );

          // CRITICAL SAFETY: Check if the error message suggests a stream object leak.
          if (
            error.message.includes("Object") ||
            error.message.includes("_readableState")
          ) {
            setError(
              "Cart loading failed due to a critical network stream error. See console for details."
            );
          } else if (!error.message.includes("Invalid token")) {
            // Only show generic network error if it's not a token issue
            // or the stream leak (which we're trying to prevent).
            setError("Failed to load cart due to connection issues.");
          }
          setCart([]); // Clear cart to reset state
        }
      } else {
        setCart([]);
      }
    };

    if (!isInitializing) {
      fetchCart();
    }
  }, [isAuthenticated, isInitializing]);

  const addToCart = async (book) => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }

    try {
      const bookId = book.id || book.product_id || book.isbn;
      console.log("Adding to cart:", { bookId, book });

      const response = await apiService.addToCart(bookId, 1);

      if (response.success) {
        const cartResponse = await apiService.getCart();
        if (cartResponse.success) {
          setCart(cartResponse.cart);
        }
        alert("Item added to cart successfully!");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(
        `Failed to add item to cart: ${error.message || "Please try again."}`
      );
    }
  };

  const removeFromCart = async (bookId) => {
    try {
      const response = await apiService.removeFromCart(bookId);
      if (response.success) {
        setCart((prev) => prev.filter((item) => item.id !== bookId));
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      alert("Failed to remove item from cart.");
    }
  };

  const updateCartQuantity = async (bookId, change) => {
    const cartItem = cart.find((item) => item.id === bookId);
    if (!cartItem) return;

    const newQuantity = cartItem.quantity + change;

    try {
      if (newQuantity <= 0) {
        await removeFromCart(bookId);
      } else {
        const response = await apiService.updateCartItem(bookId, newQuantity);
        if (response.success) {
          setCart((prev) =>
            prev.map((item) =>
              item.id === bookId ? { ...item, quantity: newQuantity } : item
            )
          );
        }
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      alert("Failed to update cart item.");
    }
  };

  const toggleFavorite = (bookId) => {
    setFavorites((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleOrderComplete = async (orderData) => {
    try {
      const response = await apiService.createOrder(orderData);
      if (response.success) {
        setCart([]);
        setShowCheckout(false);
        alert(
          "Order placed successfully! Order #" + response.order.orderNumber
        );
      }
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handleShowAuth = (show, mode = "login") => {
    setAuthMode(mode);
    setShowAuthModal(show);
  };

  const handleViewProfile = () => {
    setShowProfileModal(true);
  };

  const handleViewOrders = () => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }
    setShowOrdersModal(true);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <CheckoutPage
        cart={cart}
        getTotalPrice={getTotalPrice}
        getTotalItems={getTotalItems}
        onBack={() => setShowCheckout(false)}
        onOrderComplete={handleOrderComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showCart={showCart}
        setShowCart={setShowCart}
        getTotalItems={getTotalItems}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onViewProfile={handleViewProfile}
        onViewOrders={handleViewOrders}
        onShowAuth={handleShowAuth}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ✨ NEW: Recommendations Section - Shows only for authenticated users */}
        {isAuthenticated && user && (
          <RecommendationsSection
            userId={user.id}
            onAddToCart={addToCart}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading books...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <Sidebar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedAuthor={selectedAuthor}
              setSelectedAuthor={setSelectedAuthor}
              selectedPublisher={selectedPublisher}
              setSelectedPublisher={setSelectedPublisher}
            />

            <BooksGrid
              filteredBooks={filteredBooks}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              addToCart={addToCart}
              selectedCategory={selectedCategory}
              categories={categories}
              loading={loading}
            />
          </div>
        )}
      </div>

      <ShoppingCartSidebar
        showCart={showCart}
        setShowCart={setShowCart}
        cart={cart}
        getTotalItems={getTotalItems}
        getTotalPrice={getTotalPrice}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        onCheckout={handleCheckout}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <OrdersModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
      />
    </div>
  );
};

export default BookStore;
