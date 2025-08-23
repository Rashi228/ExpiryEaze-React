import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../lib/config';

const VendorCategorySelection = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkMedicineVerification = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${config.API_URL}/vendors/medicine-verification-status`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      return res.data.isVerified;
    } catch (err) {
      // If endpoint doesn't exist or error, assume not verified
      return false;
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    
    // Store vendor category choice in localStorage
    localStorage.setItem('vendorCategory', category);
    
    if (category === 'groceries') {
      setTimeout(() => {
        navigate('/vendor-dashboard');
      }, 1000);
    } else {
      // For medicines, check verification status
      try {
        const isVerified = await checkMedicineVerification();
        setTimeout(() => {
          if (isVerified) {
            navigate('/medicines-dashboard');
          } else {
            navigate('/medicine-vendor-verification');
          }
        }, 1000);
      } catch (err) {
        // If check fails, go to verification page
        setTimeout(() => {
          navigate('/medicine-vendor-verification');
        }, 1000);
      }
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10 py-5">
      <div className="container">
        <h1 className="display-4 fw-bold text-center mb-5">Select Your Business Type</h1>
        
        <div className="row g-4 justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm text-center p-4">
              <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: '80px', height: '80px'}}>
                <span className="display-6">🏪</span>
              </div>
              <h2 className="h3 fw-bold mb-3">Grocery Store</h2>
              <p className="text-muted mb-4">List your food and grocery products</p>
              <button
                onClick={() => handleCategorySelect("groceries")}
                className="btn btn-success fw-semibold px-4 py-2"
                disabled={loading}
              >
                {loading && selectedCategory === "groceries" ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm text-center p-4">
              <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: '80px', height: '80px'}}>
                <span className="display-6">💊</span>
              </div>
              <h2 className="h3 fw-bold mb-3">Pharmacy</h2>
              <p className="text-muted mb-4">List your medicines and health products</p>
              <button
                onClick={() => handleCategorySelect("medicines")}
                className="btn btn-success fw-semibold px-4 py-2"
                disabled={loading}
              >
                {loading && selectedCategory === "medicines" ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCategorySelection;
