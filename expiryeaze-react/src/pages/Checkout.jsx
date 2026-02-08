import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { config } from '../lib/config';
import RazorpayPayment from '../components/RazorpayPayment';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, loading, error, clearCart } = useCart();

  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [orderError, setOrderError] = useState('');
  const [paying, setPaying] = useState(false);

  const handleInputChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
    setOrderError('');
  };

  // Build payload that matches backend: userId, products, totalAmount, shippingAddress (string)
  const getOrderPayload = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shippingAddressStr = [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country].filter(Boolean).join(', ');
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
    if (!payload.userId || !payload.shippingAddress.trim()) {
      setOrderError('Please fill in all shipping details.');
      return { success: false };
    }
    try {
      await axios.post(`${config.API_URL}/orders`, payload);
      await clearCart();
      navigate('/checkout-success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to place order';
      setOrderError(msg);
      return { success: false };
    }
  };

  const handlePayWithRazorpay = async (handlePayment) => {
    setOrderError('');
    const { address, city, postalCode, country } = shippingInfo;
    if (!address?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
      setOrderError('Please fill in all shipping details before paying.');
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const amountInPaise = Math.round(subtotal * 100); // e.g. 500 → 50000 paise (₹500 INR)
    if (amountInPaise < 100) {
      setOrderError('Order total must be at least ₹1 (100 paise).');
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
      setOrderError(result.error || 'Payment failed or was cancelled.');
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
              {orderError && (
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  {orderError}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); }}>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input type="text" name="address" className="form-control" value={shippingInfo.address} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">City</label>
                  <input type="text" name="city" className="form-control" value={shippingInfo.city} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Postal Code</label>
                  <input type="text" name="postalCode" className="form-control" value={shippingInfo.postalCode} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <input type="text" name="country" className="form-control" value={shippingInfo.country} onChange={handleInputChange} required />
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
          <div className="card shadow-sm position-sticky" style={{top: '2rem'}}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Order Summary</h5>
              <div className="d-flex flex-column gap-3 mb-3">
                {cartItems.map(item => (
                  <div key={item.product._id} className="d-flex justify-content-between align-items-center">
                     <div className="d-flex align-items-center gap-3">
                        <img src={item.product.images?.[0] || item.product.imageUrl || 'https://via.placeholder.com/60'} alt={item.product.name} className="rounded" style={{width: '60px', height: '60px', objectFit: 'cover'}} />
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
