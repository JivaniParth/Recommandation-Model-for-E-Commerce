// frontend/src/components/apiService.js
const API_BASE_URL = "http://localhost:5000/api"; // E-Commerce API base URL
const RECOMMENDATION_API_BASE = "http://localhost:4000/api"; // Recommendation API base URL

class ApiService {
  constructor() {
    this.token = localStorage.getItem("access_token");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }
    return data;
  }

  // ==================== AUTH ====================

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await this.handleResponse(response);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await this.handleResponse(response);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async verifyToken() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  logout() {
    this.setToken(null);
  }

  // ==================== USER ====================

  async updateProfile(userData) {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    return await this.handleResponse(response);
  }

  // ==================== BOOKS ====================

  async getBooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/books${queryString ? `?${queryString}` : ""}`;
    const response = await fetch(url);
    return await this.handleResponse(response);
  }

  async getBook(id) {
    const response = await fetch(`${API_BASE_URL}/books/${id}`);
    return await this.handleResponse(response);
  }

  // ==================== CATEGORIES ====================

  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return await this.handleResponse(response);
  }

  // ==================== FILTERS ====================

  async getFilters() {
    const response = await fetch(`${API_BASE_URL}/filters`);
    return await this.handleResponse(response);
  }

  // ==================== CART ====================

  async getCart() {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async addToCart(bookId, quantity = 1) {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ bookId, quantity }),
    });
    return await this.handleResponse(response);
  }

  async updateCartItem(cartItemId, quantity) {
    const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return await this.handleResponse(response);
  }

  async removeFromCart(cartItemId) {
    const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  // ==================== ORDERS ====================

  async createOrder(orderData) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(orderData),
    });
    return await this.handleResponse(response);
  }

  async getOrders() {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async getOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async cancelOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  // ==================== RECOMMENDATIONS ====================

  async getRecommendations(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${RECOMMENDATION_API_BASE}/recommendations/${userId}${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await fetch(url);
    return await this.handleResponse(response);
  }

  // ==================== A/B TESTING ====================

  async getABAssignment(userId) {
    const response = await fetch(
      `${RECOMMENDATION_API_BASE}/ab/user/${userId}`
    );
    return await this.handleResponse(response);
  }

  async assignAllUsers(modelIds = [1, 2, 3]) {
    const response = await fetch(
      `${RECOMMENDATION_API_BASE}/ab/assign-all?models=${modelIds.join(",")}`,
      { method: "POST" }
    );
    return await this.handleResponse(response);
  }

  // ==================== EVENT LOGGING ====================

  async logRecommendationEvent(eventData) {
    const response = await fetch(`${RECOMMENDATION_API_BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });
    return await this.handleResponse(response);
  }

  async getModelEventCounts(modelId) {
    const response = await fetch(
      `${RECOMMENDATION_API_BASE}/events/model/${modelId}/counts`
    );
    return await this.handleResponse(response);
  }

  // ==================== ADMIN ENDPOINTS ====================

  // Admin - Stats
  async adminGetStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  // Admin - Books
  async adminGetBooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/books?${queryString}`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async adminCreateBook(bookData) {
    const response = await fetch(`${API_BASE_URL}/admin/books`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(bookData),
    });
    return await this.handleResponse(response);
  }

  async adminUpdateBook(isbn, bookData) {
    const response = await fetch(`${API_BASE_URL}/admin/books/${isbn}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(bookData),
    });
    return await this.handleResponse(response);
  }

  async adminDeleteBook(isbn) {
    const response = await fetch(`${API_BASE_URL}/admin/books/${isbn}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  // Admin - Users
  async adminGetUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/users?${queryString}`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async adminUpdateUser(userId, userData) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    return await this.handleResponse(response);
  }

  async adminDeleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  // Admin - Orders
  async adminGetOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/admin/orders?${queryString}`,
      {
        headers: this.getHeaders(),
      }
    );
    return await this.handleResponse(response);
  }

  async adminGetOrderDetails(orderId) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async adminUpdateOrder(orderId, orderData) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(orderData),
    });
    return await this.handleResponse(response);
  }

  async adminDeleteOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  // Admin - Categories
  async adminGetCategories() {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async adminCreateCategory(categoryData) {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(categoryData),
    });
    return await this.handleResponse(response);
  }

  async adminUpdateCategory(categoryName, categoryData) {
    const response = await fetch(
      `${API_BASE_URL}/admin/categories/${categoryName}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(categoryData),
      }
    );
    return await this.handleResponse(response);
  }

  async adminDeleteCategory(categoryName) {
    const response = await fetch(
      `${API_BASE_URL}/admin/categories/${categoryName}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      }
    );
    return await this.handleResponse(response);
  }

  // Admin - Authors
  async adminGetAuthors() {
    const response = await fetch(`${API_BASE_URL}/admin/authors`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async adminCreateAuthor(authorData) {
    const response = await fetch(`${API_BASE_URL}/admin/authors`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(authorData),
    });
    return await this.handleResponse(response);
  }

  async adminUpdateAuthor(authorName, authorData) {
    const response = await fetch(
      `${API_BASE_URL}/admin/authors/${authorName}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(authorData),
      }
    );
    return await this.handleResponse(response);
  }

  async adminDeleteAuthor(authorName) {
    const response = await fetch(
      `${API_BASE_URL}/admin/authors/${authorName}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      }
    );
    return await this.handleResponse(response);
  }

  // Admin - Publishers
  async adminGetPublishers() {
    const response = await fetch(`${API_BASE_URL}/admin/publishers`, {
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async adminCreatePublisher(publisherData) {
    const response = await fetch(`${API_BASE_URL}/admin/publishers`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(publisherData),
    });
    return await this.handleResponse(response);
  }

  async adminUpdatePublisher(publisherName, publisherData) {
    const response = await fetch(
      `${API_BASE_URL}/admin/publishers/${publisherName}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(publisherData),
      }
    );
    return await this.handleResponse(response);
  }

  async adminDeletePublisher(publisherName) {
    const response = await fetch(
      `${API_BASE_URL}/admin/publishers/${publisherName}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
      }
    );
    return await this.handleResponse(response);
  }

  // Admin - Reviews
  async adminGetReviews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/admin/reviews?${queryString}`,
      {
        headers: this.getHeaders(),
      }
    );
    return await this.handleResponse(response);
  }

  async adminDeleteReview(reviewId) {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }
}

const apiService = new ApiService();
export default apiService;
