import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from './components/ui/toaster';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import all pages
import Home from './pages/Home';
import JoinWaitlist from './pages/JoinWaitlist';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Signup from './pages/Signup';
import UserCategorySelection from './pages/UserCategorySelection';
import VendorCategorySelection from './pages/VendorCategorySelection';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import MedicineVendorVerification from './pages/MedicineVendorVerification';
import MedicinesDashboard from './pages/MedicinesDashboard';
import UserMedicinesDashboard from './pages/UserMedicinesDashboard';
import Dashboard from './pages/Dashboard';
import TestPage from './pages/TestPage';
import AddProduct from './pages/AddProduct';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <div className="App d-flex flex-column min-vh-100">
                <Header />
                <main className="flex-grow-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/join-waitlist" element={<JoinWaitlist />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/user-category-selection" element={<UserCategorySelection />} />
                    <Route path="/vendor-category-selection" element={<VendorCategorySelection />} />
                    <Route path="/user-dashboard" element={<UserDashboard />} />
                    <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/checkout-success" element={<CheckoutSuccess />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/medicine-vendor-verification" element={<MedicineVendorVerification />} />
                    <Route path="/medicines-dashboard" element={<MedicinesDashboard />} />
                    <Route path="/user-medicines-dashboard" element={<UserMedicinesDashboard />} />
                    <Route path="/medicines" element={<UserMedicinesDashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/add-product" element={<AddProduct />} />
                    <Route path="/edit-product/:id" element={<AddProduct />} />
                  </Routes>
                </main>
                <Footer />
                <Toaster />
              </div>
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
