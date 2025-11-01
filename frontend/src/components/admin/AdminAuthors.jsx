import React, { useState, useEffect } from "react";
import { UserCircle, Plus, Edit, Trash2, X, Save } from "lucide-react";
import apiService from "../apiService";

const AdminAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formData, setFormData] = useState({
    author_name: "",
    biography: "",
    nationality: "",
  });

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const response = await apiService.adminGetAuthors();
      if (response.success) {
        setAuthors(response.authors);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
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
      if (editingAuthor) {
        await apiService.adminUpdateAuthor(editingAuthor.author_name, formData);
        alert("Author updated successfully!");
      } else {
        await apiService.adminCreateAuthor(formData);
        alert("Author created successfully!");
      }
      setShowModal(false);
      setEditingAuthor(null);
      resetForm();
      fetchAuthors();
    } catch (error) {
      console.error("Error saving author:", error);
      alert("Failed to save author. Please try again.");
    }
  };

  const handleEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      author_name: author.author_name,
      biography: author.biography || "",
      nationality: author.nationality || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (authorName) => {
    if (!window.confirm("Are you sure you want to delete this author?")) {
      return;
    }
    try {
      await apiService.adminDeleteAuthor(authorName);
      alert("Author deleted successfully!");
      fetchAuthors();
    } catch (error) {
      console.error("Error deleting author:", error);
      alert("Failed to delete author. This author may have books.");
    }
  };

  const resetForm = () => {
    setFormData({
      author_name: "",
      biography: "",
      nationality: "",
    });
  };

  const handleAddNew = () => {
    setEditingAuthor(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <UserCircle className="w-8 h-8 mr-3 text-indigo-600" />
          Authors Management
        </h1>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Author</span>
        </button>
      </div>

      {/* Authors Table */}
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
                    Author Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Biography
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nationality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {authors.map((author) => (
                  <tr key={author.author_name} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {author.author_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {author.biography || "No biography"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {author.nationality || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(author)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(author.author_name)}
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

            {authors.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No authors found. Add your first author!
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAuthor ? "Edit Author" : "Add New Author"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Name *
                  </label>
                  <input
                    type="text"
                    name="author_name"
                    value={formData.author_name}
                    onChange={handleInputChange}
                    disabled={editingAuthor}
                    required
                    placeholder="e.g., J.K. Rowling, Stephen King"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                  {editingAuthor && (
                    <p className="text-xs text-gray-500 mt-1">
                      Author name cannot be changed
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biography
                  </label>
                  <textarea
                    name="biography"
                    value={formData.biography}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Enter author's biography"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="e.g., American, British, Indian"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
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
                    <span>{editingAuthor ? "Update" : "Create"} Author</span>
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

export default AdminAuthors;
