import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from 'react-hot-toast';
import AdminLayout from "./layouts/AdminLayout";
import Auth from "./pages/Auth";


// Page Imports
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Loans from "./pages/Loans";
import Repayments from "./pages/Repayments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Broadcast from "./pages/Broadcast";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const role = localStorage.getItem('role');
      
      if (token && user) {
        setIsAuthenticated(true);
        setUserRole(role);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Protected Route wrapper with role-based access control
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    // Check authentication
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  // Handle browser back/forward buttons for auth protection
  useEffect(() => {
    const handleNavigation = (event) => {
      if (!isAuthenticated) {
        event.preventDefault();
        window.location.href = '/auth';
      }
    };

    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading Loan Management System...</p>
          <p className="text-green-200 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications Configuration */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="mt-16"
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
          },
          // Success toast
          success: {
            duration: 3000,
            icon: '✅',
            style: {
              background: '#064e3b',
              color: '#d1fae5',
              borderLeft: '4px solid #10b981',
            },
          },
          // Error toast
          error: {
            duration: 4000,
            icon: '❌',
            style: {
              background: '#7f1d1d',
              color: '#fee2e2',
              borderLeft: '4px solid #ef4444',
            },
          },
          // Loading toast
          loading: {
            duration: Infinity,
            icon: '⏳',
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              borderLeft: '4px solid #3b82f6',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route 
          path="/auth" 
          element={
            <Auth 
              setIsAuthenticated={setIsAuthenticated} 
              setUserRole={setUserRole} 
            />
          } 
        />
        
        {/* Admin Dashboard - Accessible by super_admin and admin only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout 
                setIsAuthenticated={setIsAuthenticated} 
                setUserRole={setUserRole}
              >
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* User Management - Admin only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout 
                setIsAuthenticated={setIsAuthenticated} 
                setUserRole={setUserRole}
              >
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Loan Management - Admin only */}
        <Route
          path="/loans"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout 
                setIsAuthenticated={setIsAuthenticated} 
                setUserRole={setUserRole}
              >
                <Loans />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Repayments - Admin only */}
        <Route
          path="/repayments"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout 
                setIsAuthenticated={setIsAuthenticated} 
                setUserRole={setUserRole}
              >
                <Repayments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Reports - Admin only */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout 
                setIsAuthenticated={setIsAuthenticated} 
                setUserRole={setUserRole}
              >
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
        path="/broadcast"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <AdminLayout 
              setIsAuthenticated={setIsAuthenticated} 
              setUserRole={setUserRole}
            >
              <Broadcast />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

        {/* Settings - Admin only */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout 
                setIsAuthenticated={setIsAuthenticated} 
                setUserRole={setUserRole}
              >
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect root based on auth status */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;