import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { config } from '../lib/config';

const Header = () => {
  const { user, logout } = useAuth();
  const { token } = useAuth(); // Assuming useAuth provides token
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${config.API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${config.API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDashboardClick = () => {
    if (!user) {
      navigate('/signup');
    } else if (!user.role) {
      navigate('/user-category-selection');
    } else {
      navigate(user.role === 'vendor' ? '/vendor-dashboard' : '/user-dashboard');
    }
  };

  const handleCartClick = () => {
    if (!user) {
      navigate('/signup');
    } else if (user.role === 'vendor') {
      // Vendors don't have cart access
      alert('Vendors cannot access cart. Please use the dashboard to manage products.');
    } else {
      // For users (with or without role), go directly to cart
      navigate('/cart');
    }
  };

  const handleJoinWaitlistClick = () => {
    if (!user) {
      navigate('/signup');
    } else {
      navigate('/join-waitlist');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="header-brand-logo font-bold text-success hover:text-success-dark transition duration-300"
          >
            ExpiryEaze
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link
              to="/"
              className={`font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light ${
                isActive('/') ? "text-success bg-success-light" : ""
              }`}
            >
              Home
            </Link>
            
                         <Link
               to="/dashboard"
               className={`font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light ${
                 isActive('/dashboard') ? "text-success bg-success-light" : ""
               }`}
             >
               Dashboard
             </Link>
            
            <Link
              to="/terms"
              className={`font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light ${
                isActive('/terms') ? "text-success bg-success-light" : ""
              }`}
            >
              Terms
            </Link>
            
            <Link
              to="/privacy"
              className={`font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light ${
                isActive('/privacy') ? "text-success bg-success-light" : ""
              }`}
            >
              Privacy
            </Link>

            {user && user.role !== 'vendor' && (
              <button
                onClick={handleCartClick}
                className="font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light"
              >
                <i className="fas fa-shopping-cart h-5 w-5"></i>
              </button>
            )}

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setDropdownOpen(false);
                    if (!notifOpen) fetchNotifications();
                  }}
                  className="relative font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light"
                >
                  <i className="fas fa-bell h-5 w-5"></i>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-1 right-1 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 max-h-[400px] overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <span className="font-bold text-gray-800">Notifications</span>
                      <span className="text-xs text-success cursor-pointer hover:underline" onClick={() => setNotifications([])}>Clear all</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <i className="fas fa-bell-slash mb-2 block text-2xl opacity-20"></i>
                        <p className="text-sm">No new alerts</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id} 
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${!notif.isRead ? 'bg-success-light/30' : ''}`}
                          onClick={() => markAsRead(notif._id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'ExpiryWarning' ? 'bg-danger' : 'bg-info'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800 mb-0.5">{notif.title}</p>
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center space-x-1 font-bold text-gray-700 hover:text-success transition duration-300 px-3 py-2 rounded-full hover:bg-success-light"
                >
                  <i className="fas fa-user h-5 w-5"></i>
                  <span>{user.name || user.email?.split("@")[0]}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/order-history"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <i className="fas fa-box h-4 w-4 mr-2"></i>
                      Order History
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fas fa-sign-out-alt h-4 w-4 mr-2"></i>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="font-bold text-white bg-success hover:bg-success-dark transition duration-300 px-4 py-2 rounded-full"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-success focus:outline-none"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} h-6 w-6`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link
              to="/"
              className={`block py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full ${
                isActive('/') ? "text-success bg-success-light" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            
                         <Link
               to="/dashboard"
               className={`block py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full ${
                 isActive('/dashboard') ? "text-success bg-success-light" : ""
               }`}
               onClick={() => setIsOpen(false)}
             >
               Dashboard
             </Link>
            
            <Link
              to="/terms"
              className={`block py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full ${
                isActive('/terms') ? "text-success bg-success-light" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              Terms
            </Link>
            
            <Link
              to="/privacy"
              className={`block py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full ${
                isActive('/privacy') ? "text-success bg-success-light" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              Privacy
            </Link>

            {user && user.role !== 'vendor' && (
              <button
                onClick={() => {
                  handleCartClick();
                  setIsOpen(false);
                }}
                className="flex items-center w-full py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full"
              >
                <i className="fas fa-shopping-cart h-5 w-5 mr-2"></i>
                Cart
              </button>
            )}

            {user ? (
              <>
                <Link
                  to="/order-history"
                  className="flex items-center w-full py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-box h-5 w-5 mr-2"></i>
                  Order History
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full py-2 px-4 font-bold text-gray-700 hover:text-success hover:bg-success-light rounded-full"
                >
                <i className="fas fa-sign-out-alt h-5 w-5 mr-2"></i>
                Sign out
              </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block py-2 px-4 font-bold text-white bg-success hover:bg-success-dark rounded-full text-center"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
