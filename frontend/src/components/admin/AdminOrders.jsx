import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Search,
  Eye,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import apiService from "../apiService";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        per_page: 20,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await apiService.adminGetOrders(params);
      if (response.success) {
        setOrders(response.orders);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) return;

    try {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: true }));
      // Use admin-specific endpoint instead of regular getOrder
      const response = await apiService.adminGetOrderDetails(orderId);
      if (response.success) {
        setOrderDetails((prev) => ({ ...prev, [orderId]: response.order }));
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: false }));
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiService.adminUpdateOrder(orderId, {
        payment_status: newStatus,
      });
      alert("Order status updated successfully!");
      fetchOrders();
      // Refresh order details if expanded
      if (expandedOrder === orderId) {
        setOrderDetails((prev) => ({ ...prev, [orderId]: null }));
        await fetchOrderDetails(orderId);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status.");
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await apiService.adminDeleteOrder(orderId);
      alert("Order deleted successfully!");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00";
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  // Debug: Log the order data to see what we're getting
  useEffect(() => {
    if (orders.length > 0) {
      console.log("First order data:", orders[0]);
      console.log("Total amount:", orders[0].totalAmount);
      console.log("Type:", typeof orders[0].totalAmount);
    }
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="w-8 h-8 mr-3 text-indigo-600" />
          Orders Management
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Filter by Status:
            </label>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {orders.map((order) => {
              const details = orderDetails[order.id];
              const isLoading = loadingDetails[order.id];
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Order Summary */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleOrderDetails(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Package className="w-5 h-5 text-gray-400" />
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
                              {order.status}
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
                            {order.itemsCount || 0} items
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ${formatPrice(order.totalAmount)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                      ) : details ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer Info */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Customer Information
                            </h4>
                            <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                              <p>
                                <span className="font-medium">Name:</span>{" "}
                                {details.customer?.fullName || "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                {details.customer?.email || "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">Phone:</span>{" "}
                                {details.customer?.phone || "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">Address:</span>{" "}
                                {details.shipping?.fullAddress || "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Order Items
                            </h4>
                            <div className="space-y-2">
                              {details.items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-white p-3 rounded-lg flex items-center space-x-3"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Qty: {item.quantity} × $
                                      {formatPrice(item.pricePerItem)}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold">
                                    ${formatPrice(item.totalPrice)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-gray-700">
                                Update Status:
                              </label>
                              <select
                                value={details.payment?.status || "pending"}
                                onChange={(e) =>
                                  handleUpdateStatus(order.id, e.target.value)
                                }
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(order.id);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Order</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">
                          Failed to load order details
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing page {pagination.page} of {pagination.pages} (
            {pagination.total} total orders)
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
