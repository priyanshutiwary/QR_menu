import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RestaurantDashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import TableOrder from './pages/TableOrder';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const { setUser, loadUserType } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserType();
      }
    });

    return () => unsubscribe();
  }, [setUser, loadUserType]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          } />
          <Route path="/table/:restaurantId/:tableId" element={<TableOrder />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

// Component to route to appropriate dashboard based on user type
function DashboardRouter() {
  const { userType } = useAuthStore();

  if (userType === 'restaurant') {
    return <RestaurantDashboard />;
  }

  if (userType === 'customer') {
    return <CustomerDashboard />;
  }

  return <Navigate to="/" />;
}

export default App;