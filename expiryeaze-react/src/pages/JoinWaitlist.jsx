import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { config } from '../lib/config';

const JoinWaitlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number - only allow digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!user) {
      setError('You must be signed in to join the waitlist.');
      setIsSubmitting(false);
      return;
    }
    if (formData.email !== user.email) {
      setError('The email must match your signed-in account.');
      setIsSubmitting(false);
      return;
    }
    
    // Phone number validation
    if (!formData.phone) {
      setError('Phone number is required.');
      setIsSubmitting(false);
      return;
    }
    
    // Remove any non-digit characters and validate 10 digits
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/auth/waitlist`, {
        ...formData,
        phone: phoneDigits, // Use the cleaned phone number
        role: selectedRole,
      });
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify({ ...formData, role: selectedRole }));
        if (selectedRole === 'vendor') {
          navigate('/vendor-category-selection');
        } else {
          navigate('/user-category-selection');
        }
      } else {
        // If duplicate error, treat as success
        if (res.data.error && res.data.error.includes('already joined')) {
          localStorage.setItem('user', JSON.stringify({ ...formData, role: selectedRole }));
          if (selectedRole === 'vendor') {
            navigate('/vendor-category-selection');
          } else {
            navigate('/user-category-selection');
          }
        } else {
          setError(res.data.error || 'Failed to join waitlist.');
        }
      }
    } catch (err) {
      // If duplicate error, treat as success
      const backendError = err.response?.data?.error;
      if (backendError && backendError.includes('already joined')) {
        localStorage.setItem('user', JSON.stringify({ ...formData, role: selectedRole }));
        if (selectedRole === 'vendor') {
          navigate('/vendor-category-selection');
        } else {
          navigate('/user-category-selection');
        }
      } else {
        setError(backendError || 'Failed to join waitlist.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">You must be signed in to join the waitlist.</div>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
      </div>
    );
  }

  if (!selectedRole) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10 py-5">
        <div className="container">
          <h1 className="display-4 fw-bold text-center text-dark mb-5">Select Your Role</h1>
          
          <div className="row g-4">
            {/* Vendor Card */}
            <div className="col-md-6">
              <div className="card h-100 shadow-sm text-center p-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: '80px', height: '80px'}}>
                  <span className="display-6">🏢</span>
                </div>
                <h2 className="h3 fw-bold mb-3">Vendor</h2>
                <p className="text-muted mb-4">Register as a business to list your products and manage inventory</p>
                <button
                  onClick={() => handleRoleSelect("vendor")}
                  className="btn btn-success fw-semibold px-4 py-2"
                >
                  Continue as Vendor
                </button>
              </div>
            </div>

            {/* User Card */}
            <div className="col-md-6">
              <div className="card h-100 shadow-sm text-center p-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: '80px', height: '80px'}}>
                  <span className="display-6">👤</span>
                </div>
                <h2 className="h3 fw-bold mb-3">User</h2>
                <p className="text-muted mb-4">Sign up as a consumer to access exclusive deals and manage purchases</p>
                <button
                  onClick={() => handleRoleSelect("user")}
                  className="btn btn-success fw-semibold px-4 py-2"
                >
                  Continue as User
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h2 fw-bold text-dark mb-2">
                    Join as {selectedRole === "vendor" ? "Vendor" : "User"}
                  </h1>
                  <p className="text-muted">
                    Be part of the solution for a sustainable future.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <span className="me-2">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-semibold">
                      Full Name <span className="text-muted">(First Name + Last Name)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        const trimmed = e.target.value.trim();
                        handleInputChange({ target: { name: 'name', value: trimmed } });
                      }}
                      required
                      minLength="5"
                      pattern="^[A-Za-z]{2,}(\s+[A-Za-z]{2,})+$"
                      title="Please enter your full name with first name and last name (e.g., 'John Doe'). Each name must be at least 2 letters."
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      required
                      pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
                      title="Please enter a valid email address with proper domain (e.g., user@example.com). Domain must have a top-level domain like .com, .org, etc."
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label fw-semibold">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter 10-digit phone number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      required
                    />
                    
                  </div>
                  <div className="mb-4">
                    <label htmlFor="location" className="form-label fw-semibold">
                      Location
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <button
                        type="button"
                        onClick={() => setSelectedRole(null)}
                        className="btn btn-outline-secondary w-100"
                        disabled={isSubmitting}
                      >
                        Back
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinWaitlist;
