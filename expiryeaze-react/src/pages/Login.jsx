import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/user-dashboard'); // Or wherever you want to redirect after login
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
                  <h1 className="h2 fw-bold text-dark mb-2">Sign In</h1>
                  <p className="text-muted">Welcome back to ExpiryEaze</p>
                </div>

                {error && (
                  <div className="alert alert-danger mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
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

                  <div className="mb-4">
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
                    />
                  </div>

                  <div className="d-flex justify-content-end mb-3">
                    <Link to="/forgot-password" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Don't have an account?{' '}
                      <Link to="/signup" className="text-decoration-none text-success">
                        Sign up
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

export default Login;
