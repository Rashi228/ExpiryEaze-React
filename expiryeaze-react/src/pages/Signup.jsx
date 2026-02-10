import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const success = await signup(name, email, password, role);
    if (success) {
      setMessage('Signup successful! Please proceed to login.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h2 fw-bold text-dark mb-2">Sign Up</h1>
                  <p className="text-muted">Join ExpiryEaze today</p>
                </div>

                {error && (
                  <div className="alert alert-danger mb-4">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="alert alert-success mb-4">
                    {message}
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={(e) => setName(e.target.value.trim())}
                      required
                      minLength="5"
                      // STRICT PATTERN: Requires first name + last name (at least 2 words, each min 2 characters)
                      pattern="^[A-Za-z]{2,}(\s+[A-Za-z]{2,})+$"
                      // UPDATED TITLE:
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      // STRICT PATTERN: Requires proper domain with TLD (e.g., example.com, not just example)
                      pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
                      title="Please enter a valid email address with proper domain (e.g., user@example.com). Domain must have a top-level domain like .com, .org, etc."
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength="8" // Add minLength
                      // Fixed regex: Added * quantifier in lookaheads
                      pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                      title="Must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character (@$!%*?&)." // Explain the error
                    />
                  </div>
                  
                  {/* <div className="mb-3">
                    <label className="form-label">Sign up as a:</label>
                    <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="user">User</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div> */}
                  
                  <button
                    type="submit"
                    className="btn btn-success w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                  
                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none text-success">
                        Sign in
                      </Link>
                    </p>
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

export default Signup;
