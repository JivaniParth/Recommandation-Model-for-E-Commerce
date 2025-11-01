import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Book,
  Users,
  Package,
  Star,
  Grid3x3,
  UserCircle,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "./useAuth";
import apiService from "./apiService";

// Import admin components
import AdminStats from "./admin/AdminStats";
import AdminBooks from "./admin/AdminBooks";
import AdminUsers from "./admin/AdminUsers";
import AdminOrders from "./admin/AdminOrders";
import AdminCategories from "./admin/AdminCategories";
import AdminAuthors from "./admin/AdminAuthors";
import AdminPublishers from "./admin/AdminPublishers";
import AdminReviews from "./admin/AdminReviews";

const AdminDashboard = ({ onLogout }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "books", label: "Books", icon: Book },
    { id: "users", label: "Users", icon: Users },
    { id: "orders", label: "Orders", icon: Package },
    { id: "categories", label: "Categories", icon: Grid3x3 },
    { id: "authors", label: "Authors", icon: UserCircle },
    { id: "publishers", label: "Publishers", icon: FileText },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminStats />;
      case "books":
        return <AdminBooks />;
      case "users":
        return <AdminUsers />;
      case "orders":
        return <AdminOrders />;
      case "categories":
        return <AdminCategories />;
      case "authors":
        return <AdminAuthors />;
      case "publishers":
        return <AdminPublishers />;
      case "reviews":
        return <AdminReviews />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-indigo-600">
                BookHaven Admin
              </h1>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar}
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
