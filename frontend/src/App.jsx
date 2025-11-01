import "./App.css";
import BookStore from "./components/BookStore";
import AdminDashboard from "./Components/AdminDashboard";
import ErrorBoundary from "./Components/ErrorBoundary";
import { AuthProvider } from "./components/AuthContext";
import { useAuth } from "./components/useAuth";
import APIDiagnostics from "./components/APIDiagnostics";

// Wrapper component to check user type
const AppContent = () => {
  const { user, logout, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if user is admin
  if (user && user.user_type === "admin") {
    return <AdminDashboard onLogout={logout} />;
  }

  // Regular bookstore for customers
  return <BookStore />;
  // return <APIDiagnostics />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
