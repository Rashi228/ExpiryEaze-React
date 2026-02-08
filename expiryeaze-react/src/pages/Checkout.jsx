import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { config } from '../lib/config';
import RazorpayPayment from '../components/RazorpayPayment';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, loading, error, clearCart } = useCart();

  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'address':
        if (!value.trim()) errorMsg = 'Address is required';
        else if (value.length < 5) errorMsg = 'Address must be at least 5 characters';
        break;
      case 'city':
        if (!value.trim()) errorMsg = 'City is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) errorMsg = 'City must contain only letters';
        break;
      case 'state':
        if (!value) errorMsg = 'State is required';
        break;
      case 'postalCode':
        if (!value) errorMsg = 'Postal Code is required';
        else if (!/^\d{6}$/.test(value)) errorMsg = 'Postal Code must be exactly 6 digits';
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Specific handling for postal code to allow only numbers
    if (name === 'postalCode') {
      if (value && !/^\d*$/.test(value)) return;
      // Limit to 6 chars
      if (value.length > 6) return;
    }

    setShippingInfo({ ...shippingInfo, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setGlobalError('');
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    ['address', 'city', 'state', 'postalCode'].forEach(field => {
      const errorMsg = validateField(field, shippingInfo[field]);
      if (errorMsg) {
        newErrors[field] = errorMsg;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Build payload that matches backend: userId, products, totalAmount, shippingAddress (string)
  const getOrderPayload = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    // Format: Address, City, State, Postal Code, Country
    const shippingAddressStr = [
      shippingInfo.address,
      shippingInfo.city,
      shippingInfo.state,
      shippingInfo.postalCode,
      shippingInfo.country
    ].filter(Boolean).join(', ');

    return {
      userId: user?.id,
      products: cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount: subtotal,
      shippingAddress: shippingAddressStr,
    };
  };

  const placeOrderAfterPayment = async () => {
    const payload = getOrderPayload();
    try {
      await axios.post(`${config.API_URL}/orders`, payload);
      await clearCart();
      navigate('/checkout-success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to place order';
      setGlobalError(msg);
      return { success: false };
    }
  };

  const handlePayWithRazorpay = async (handlePayment) => {
    setGlobalError('');

    if (!validateForm()) {
      setGlobalError('Please fix the errors in the form before proceeding.');
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const amountInPaise = Math.round(subtotal * 100);
    if (amountInPaise < 100) {
      setGlobalError('Order total must be at least ₹1 (100 paise).');
      return;
    }

    setPaying(true);
    const result = await handlePayment(amountInPaise, {
      name: 'ExpiryEaze',
      description: 'Order payment',
      prefill: { email: user?.email || '', name: user?.name || '' },
    });
    setPaying(false);

    if (result.success) {
      await placeOrderAfterPayment();
    } else {
      setGlobalError(result.error || 'Payment failed or was cancelled.');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) return <div className="text-center mt-5">Loading Checkout...</div>;
  if (error) return <div className="alert alert-danger mt-5">{error}</div>;

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-info">Your cart is empty.</div>
        <button className="btn btn-primary" onClick={() => navigate('/user-dashboard')}>Browse Products</button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4 fw-bold">Checkout</h1>
      <div className="row g-5">
        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title fw-semibold mb-3">Shipping Information</h5>
              {globalError && (
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  {globalError}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); }}>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    name="address"
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    placeholder="House No, Street Name"
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">State</label>
                    <select
                      name="state"
                      className={`form-select ${errors.state ? 'is-invalid' : ''}`}
                      value={shippingInfo.state}
                      onChange={handleInputChange}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      className={`form-control ${errors.postalCode ? 'is-invalid' : ''}`}
                      value={shippingInfo.postalCode}
                      onChange={handleInputChange}
                      placeholder="6-digit ZIP code"
                      maxLength={6}
                    />
                    {errors.postalCode && <div className="invalid-feedback">{errors.postalCode}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      name="country"
                      className="form-control"
                      value={shippingInfo.country}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <RazorpayPayment>
                  {({ handlePayment }) => (
                    <button
                      type="button"
                      className="btn btn-success w-100 btn-lg mt-3"
                      disabled={paying}
                      onClick={() => handlePayWithRazorpay(handlePayment)}
                    >
                      {paying ? 'Opening Razorpay…' : 'Pay with Razorpay'}
                    </button>
                  )}
                </RazorpayPayment>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card shadow-sm position-sticky" style={{ top: '2rem' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Order Summary</h5>
              <div className="d-flex flex-column gap-3 mb-3">
                {cartItems.map(item => (
                  <div key={item.product._id} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <img src={item.product.images?.[0] || item.product.imageUrl || 'https://via.placeholder.com/60'} alt={item.product.name} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                      <div>
                        <div className="fw-semibold">{item.product.name}</div>
                        <small className="text-muted">Qty: {item.quantity}</small>
                      </div>
                    </div>
                    <span className="fw-semibold">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center fw-bold fs-5">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
