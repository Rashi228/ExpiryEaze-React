import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:5001/api/v1/auth/forgotpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setStep(2);
                setMessage('OTP sent to your email. Please check your inbox.');
            } else {
                setError(data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:5001/api/v1/auth/resetpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp, password: newPassword }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Password reset successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-4">
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold text-dark">
                                        {step === 1 ? 'Forgot Password' : 'Reset Password'}
                                    </h2>
                                    <p className="text-muted small">
                                        {step === 1
                                            ? 'Enter your email to receive an OTP'
                                            : 'Enter the OTP and your new password'}
                                    </p>
                                </div>

                                {message && <div className="alert alert-success">{message}</div>}
                                {error && <div className="alert alert-danger">{error}</div>}

                                {step === 1 ? (
                                    <form onSubmit={handleRequestOtp}>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100"
                                            disabled={loading}
                                        >
                                            {loading ? 'Sending OTP...' : 'Send OTP'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword}>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">OTP</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                placeholder="Enter 6-digit OTP"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">New Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                placeholder="Enter new password"
                                                minLength={8}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100"
                                            disabled={loading}
                                        >
                                            {loading ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </form>
                                )}

                                <div className="text-center mt-3">
                                    <Link to="/login" className="text-decoration-none text-muted small">
                                        Back to Sign In
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
