import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoinWaitlistClick = () => {
    if (!user) {
      navigate('/signup');
    } else {
      navigate('/join-waitlist');
    }
  };

  const handleDashboardClick = () => {
    if (!user) {
      navigate('/signup');
    } else {
      // Redirect to simple dashboard for all users
      navigate('/dashboard');
    }
  };

  const handleBrowseGroceriesClick = () => {
    if (!user) {
      navigate('/login');
    } else if (!user.role) {
      navigate('/join-waitlist');
    } else {
      navigate('/dashboard');
    }
  };

  const handleBrowseMedicinesClick = () => {
    if (!user) {
      navigate('/login');
    } else if (!user.role) {
      navigate('/join-waitlist');
    } else {
      navigate('/medicines');
    }
  };

  const handleCartClick = () => {
    if (!user) {
      navigate('/signup');
    } else if (!user.role) {
      navigate('/user-category-selection');
    } else if (user.role === 'vendor') {
      alert('Vendors cannot access cart. Please use the dashboard to manage products.');
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Hero Section */}
      <section className="bg-success text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Save More. Waste Less. Make an Impact.
              </h1>
              <p className="lead mb-4">
                Discover unbeatable discounts on near-expiry food and medicines while helping the planet. 
                Join thousands of smart shoppers who save money and reduce waste.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <button
                  onClick={handleJoinWaitlistClick}
                  className="btn btn-light btn-lg fw-bold px-4"
                >
                  Join Waitlist
                </button>
                <button
                  onClick={handleDashboardClick}
                  className="btn btn-outline-light btn-lg fw-bold px-4"
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </button>
              </div>
            </div>
            <div className="col-lg-6">
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop"
                alt="Fresh produce"
                className="img-fluid rounded shadow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">Why Choose ExpiryEaze?</h2>
            <p className="lead text-muted">
              Smart shopping that benefits you and the environment
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-dollar-sign text-success fs-1"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Save Money</h4>
                  <p className="text-muted">
                    Get up to 70% off on quality products that are near their expiry date. 
                    Perfect for immediate consumption or short-term use.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-leaf text-success fs-1"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Reduce Waste</h4>
                  <p className="text-muted">
                    Help prevent perfectly good food and medicines from going to waste. 
                    Every purchase makes a positive environmental impact.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-shield-alt text-success fs-1"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Quality Assured</h4>
                  <p className="text-muted">
                    All products are verified for quality and safety. 
                    We work with trusted vendors to ensure you get the best deals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">Shop by Category</h2>
            <p className="lead text-muted">
              Find great deals on food and medicines
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="row g-0">
                  <div className="col-md-4">
                    <img
                      src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=200&fit=crop"
                      alt="Groceries"
                      className="img-fluid h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body">
                      <h4 className="fw-bold mb-2">Groceries & Food</h4>
                      <p className="text-muted mb-3">
                        Fresh produce, dairy, bakery items, and packaged foods at unbeatable prices.
                      </p>
                      <button
                        onClick={handleBrowseGroceriesClick}
                        className="btn btn-success fw-bold"
                      >
                        Browse Groceries
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="row g-0">
                  <div className="col-md-4">
                    <img
                      src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop"
                      alt="Medicines"
                      className="img-fluid h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body">
                      <h4 className="fw-bold mb-2">Medicines & Health</h4>
                      <p className="text-muted mb-3">
                        Prescription and over-the-counter medicines, supplements, and health products.
                      </p>
                      <button
                        onClick={handleBrowseMedicinesClick}
                        className="btn btn-success fw-bold"
                      >
                        Browse Medicines
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-success text-white">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Start Saving?</h2>
          <p className="lead mb-4">
            Join our community of smart shoppers and start making a difference today.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <button
              onClick={handleJoinWaitlistClick}
              className="btn btn-light btn-lg fw-bold px-4"
            >
              Join Waitlist
            </button>
            <button
              onClick={handleDashboardClick}
              className="btn btn-outline-light btn-lg fw-bold px-4"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
