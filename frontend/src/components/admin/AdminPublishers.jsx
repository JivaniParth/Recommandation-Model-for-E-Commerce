import React, { useState, useEffect } from "react";
import { FileText, Plus, Edit, Trash2, X, Save } from "lucide-react";
import apiService from "../apiService";

const AdminPublishers = () => {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState(null);
  const [formData, setFormData] = useState({
    publisher_name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    established_date: "",
  });

  useEffect(() => {
    fetchPublishers();
  }, []);

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      const response = await apiService.adminGetPublishers();
      if (response.success) {
        setPublishers(response.publishers);
      }
    } catch (error) {
      console.error("Error fetching publishers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPublisher) {
        await apiService.adminUpdatePublisher(
          editingPublisher.publisher_name,
          formData
        );
        alert("Publisher updated successfully!");
      } else {
        await apiService.adminCreatePublisher(formData);
        alert("Publisher created successfully!");
      }
      setShowModal(false);
      setEditingPublisher(null);
      resetForm();
      fetchPublishers();
    } catch (error) {
      console.error("Error saving publisher:", error);
      alert("Failed to save publisher. Please try again.");
    }
  };

  const handleEdit = (publisher) => {
    setEditingPublisher(publisher);
    setFormData({
      publisher_name: publisher.publisher_name,
      address: publisher.address || "",
      city: publisher.city || "",
      phone: publisher.phone || "",
      email: publisher.email || "",
      established_date: publisher.established_date || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (publisherName) => {
    if (!window.confirm("Are you sure you want to delete this publisher?")) {
      return;
    }
    try {
      await apiService.adminDeletePublisher(publisherName);
      alert("Publisher deleted successfully!");
      fetchPublishers();
    } catch (error) {
      console.error("Error deleting publisher:", error);
      alert("Failed to delete publisher. This publisher may have books.");
    }
  };

  const resetForm = () => {
    setFormData({
      publisher_name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      established_date: "",
    });
  };

  const handleAddNew = () => {
    setEditingPublisher(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-indigo-600" />
          Publishers Management
        </h1>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Publisher</span>
        </button>
      </div>

      {/* Publishers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Publisher Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Established
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {publishers.map((publisher) => (
                  <tr
                    key={publisher.publisher_name}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {publisher.publisher_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {publisher.email || "N/A"}
                        </p>
                        <p className="text-gray-500">
                          {publisher.phone || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {publisher.city || "N/A"}
                        </p>
                        <p className="text-gray-500 text-xs line-clamp-1">
                          {publisher.address || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {publisher.established_date
                        ? new Date(
                            publisher.established_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(publisher)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(publisher.publisher_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {publishers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No publishers found. Add your first publisher!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPublisher ? "Edit Publisher" : "Add New Publisher"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publisher Name *
                    </label>
                    <input
                      type="text"
                      name="publisher_name"
                      value={formData.publisher_name}
                      onChange={handleInputChange}
                      disabled={editingPublisher}
                      required
                      placeholder="e.g., Penguin Random House, HarperCollins"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                    {editingPublisher && (
                      <p className="text-xs text-gray-500 mt-1">
                        Publisher name cannot be changed
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter publisher's address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., New York, London"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g., +1-555-0123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g., contact@publisher.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Established Date
                    </label>
                    <input
                      type="date"
                      name="established_date"
                      value={formData.established_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {editingPublisher ? "Update" : "Create"} Publisher
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPublishers;
