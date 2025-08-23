import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { config } from '../lib/config';

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

  const handleInputChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user || cartItems.length === 0) return;

    try {
      const orderItems = cartItems.map(item => ({
        name: item.product.name,
        qty: item.quantity,
        image: item.product.images?.[0] || item.product.imageUrl || '',
        price: item.product.price,
        product: item.product._id,
      }));
      
      const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      await axios.post(`${config.API_URL}/orders`, {
        orderItems,
        shippingAddress: shippingInfo,
        totalPrice: subtotal,
        user: user.id,
      });
      
      await clearCart();
      navigate('/checkout-success');
    } catch (err) {
      console.error('Failed to place order:', err);
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
              <form onSubmit={handlePlaceOrder}>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input type="text" name="address" className="form-control" onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">City</label>
                  <input type="text" name="city" className="form-control" onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Postal Code</label>
                  <input type="text" name="postalCode" className="form-control" onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <input type="text" name="country" className="form-control" onChange={handleInputChange} required />
                </div>
                <button type="submit" className="btn btn-success w-100 btn-lg mt-3">Place Order</button>
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
                    <span className="fw-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center fw-bold fs-5">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
