import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import apiService from "./apiService";

const OrdersModal = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOrders();
      if (response.success) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) {
      return; // Already loaded
    }

    try {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: true }));
      const response = await apiService.getOrder(orderId);
      if (response.success) {
        setOrderDetails((prev) => ({ ...prev, [orderId]: response.order }));
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <Clock className="w-5 h-5 text-gray-500" />;

    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "confirmed":
      case "processing":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const response = await apiService.cancelOrder(orderId);
      if (response.success) {
        await fetchOrders();
        // Refresh order details if expanded
        if (expandedOrder === orderId) {
          setOrderDetails((prev) => ({ ...prev, [orderId]: null }));
          await fetchOrderDetails(orderId);
        }
        alert("Order cancelled successfully");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      await fetchOrderDetails(orderId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="w-7 h-7 mr-2 text-indigo-600" />
              My Orders
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your orders...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
                >
                  Try Again
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No orders yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start shopping to place your first order!
                </p>
                <button
                  onClick={onClose}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const details = orderDetails[order.id];
                  const isLoading = loadingDetails[order.id];

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(order.status)}
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {order.status
                                    ? order.status.charAt(0).toUpperCase() +
                                      order.status.slice(1)
                                    : "Unknown"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {order.itemsCount} items
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                ${parseFloat(order.totalAmount).toFixed(2)}
                              </p>
                            </div>
                            {expandedOrder === order.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedOrder === order.id && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {isLoading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                              <p className="mt-2 text-sm text-gray-600">
                                Loading order details...
                              </p>
                            </div>
                          ) : details ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">
                                  Order Items
                                </h4>
                                <div className="space-y-3">
                                  {details.items && details.items.length > 0 ? (
                                    details.items.map((item, index) => (
                                      <div
                                        key={item.isbn || item.id || index}
                                        className="flex items-center space-x-3 bg-white p-3 rounded-lg"
                                      >
                                        <img
                                          src={
                                            item.image ||
                                            "/placeholder-book.png"
                                          }
                                          alt={item.title}
                                          className="w-12 h-16 object-cover rounded"
                                          onError={(e) => {
                                            e.target.src =
                                              "/placeholder-book.png";
                                          }}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {item.title}
                                          </h5>
                                          <p className="text-xs text-gray-600">
                                            {item.author}
                                          </p>
                                          <p className="text-sm text-gray-700 mt-1">
                                            Qty: {item.quantity} × $
                                            {parseFloat(
                                              item.price ||
                                                item.pricePerItem ||
                                                0
                                            ).toFixed(2)}
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          $
                                          {(
                                            parseFloat(
                                              item.price ||
                                                item.pricePerItem ||
                                                0
                                            ) * (item.quantity || 1)
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500">
                                      No items found
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">
                                  Order Summary
                                </h4>
                                <div className="bg-white p-4 rounded-lg space-y-2">
                                  {(() => {
                                    const itemsSubtotal =
                                      details.items?.reduce((sum, item) => {
                                        return (
                                          sum +
                                          parseFloat(item.price || 0) *
                                            (item.quantity || 0)
                                        );
                                      }, 0) || 0;

                                    const totalAmount = parseFloat(
                                      order.totalAmount || 0
                                    );
                                    const tax = totalAmount - itemsSubtotal;
                                    const shipping = 0; // Assuming free shipping

                                    return (
                                      <>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">
                                            Subtotal:
                                          </span>
                                          <span className="text-gray-900">
                                            ${itemsSubtotal.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">
                                            Tax:
                                          </span>
                                          <span className="text-gray-900">
                                            ${tax > 0 ? tax.toFixed(2) : "0.00"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">
                                            Shipping:
                                          </span>
                                          <span className="text-green-600 font-medium">
                                            {shipping === 0
                                              ? "Free"
                                              : `$${shipping.toFixed(2)}`}
                                          </span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                          <div className="flex justify-between font-semibold">
                                            <span className="text-gray-900">
                                              Total:
                                            </span>
                                            <span className="text-indigo-600">
                                              ${totalAmount.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>

                                <h4 className="font-semibold text-gray-900 mt-4 mb-2">
                                  Shipping Address
                                </h4>
                                <div className="bg-white p-4 rounded-lg text-sm text-gray-700">
                                  <p className="font-medium text-gray-900">
                                    {details.customer?.fullName || "N/A"}
                                  </p>
                                  <p>
                                    {details.shipping?.fullAddress || "N/A"}
                                  </p>
                                  <p className="mt-2 text-gray-600">
                                    {details.customer?.phone || "N/A"}
                                  </p>
                                </div>

                                {order.status.toLowerCase() === "pending" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelOrder(order.id);
                                    }}
                                    className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              Failed to load order details
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;
