import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout & Views
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Warehouses from '../pages/Warehouses';
import Purchases from '../pages/Purchases';
import Sales from '../pages/Sales';
import Transfers from '../pages/Transfers';
import Reports from '../pages/Reports';
import Analytics from '../pages/Analytics';
import Suppliers from '../pages/Suppliers';
import Customers from '../pages/Customers';
import Settings from '../pages/Settings';
import ActivityLogs from '../pages/ActivityLogs';
import Inventory from '../pages/Inventory';
import NotFound from '../pages/NotFound';

// Protected Route Guard (Requires Login & Permissions check)
const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/404" replace />; // Redirect unauthorized to custom error page
  }

  return children;
};

// Auth Route Guard (Redirects away from Login/Signup if logged in)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Auth Guards */}
        <Route 
          path="/login" 
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <AuthRoute>
              <Signup />
            </AuthRoute>
          } 
        />

        {/* Dashboard layouts Protected Guards */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route 
            path="products" 
            element={
              <ProtectedRoute permission="view_products">
                <Products />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="inventory" 
            element={
              <ProtectedRoute permission="view_products">
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="categories" 
            element={
              <ProtectedRoute permission="view_categories">
                <Categories />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="warehouses" 
            element={
              <ProtectedRoute permission="view_warehouses">
                <Warehouses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchases" 
            element={
              <ProtectedRoute permission="view_purchases">
                <Purchases />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="sales" 
            element={
              <ProtectedRoute permission="view_sales">
                <Sales />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="transfers" 
            element={
              <ProtectedRoute permission="view_transfers">
                <Transfers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <ProtectedRoute permission="view_reports">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute permission="view_reports">
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="suppliers" 
            element={
              <ProtectedRoute permission="view_suppliers">
                <Suppliers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="customers" 
            element={
              <ProtectedRoute permission="view_customers">
                <Customers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <ProtectedRoute permission="manage_settings">
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="logs" 
            element={
              <ProtectedRoute permission="view_logs">
                <ActivityLogs />
              </ProtectedRoute>
            } 
          />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
