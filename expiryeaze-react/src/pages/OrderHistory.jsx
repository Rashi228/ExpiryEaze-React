import React, { useEffect } from 'react';
import { useOrders } from '../contexts/OrderContext';
import { Package, MapPin, Calendar, Clock, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const { orders, loading, error, fetchOrders } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-success';
      case 'Shipped':
        return 'bg-primary';
      case 'Pending Prescription':
        return 'bg-warning text-dark';
      case 'Cancelled':
        return 'bg-danger';
      default: // Pending
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
        <p className="mt-3 text-muted">Fetching your order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-outline-success mt-3" onClick={() => fetchOrders()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: '900px' }}>
      <div className="d-flex align-items-center mb-4">
        <button 
          className="btn btn-link text-success p-0 me-3" 
          onClick={() => navigate(-1)}
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="fw-bold fs-2 mb-0">Order History</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
              <ShoppingBag size={48} className="text-muted" />
            </div>
            <h3 className="fw-bold mb-3">No Orders Yet</h3>
            <p className="text-muted mb-4">You haven't placed any orders with us yet. Start exploring our products!</p>
            <Link to="/user-dashboard" className="btn btn-success px-4 py-2 rounded-pill fw-semibold">
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.slice().reverse().map((order) => (
            <div key={order._id} className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-white border-bottom p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <p className="text-muted small mb-1">
                    <span className="fw-semibold text-dark">Order ID:</span> #{order._id.toString().slice(-8).toUpperCase()}
                  </p>
                  <p className="text-muted small mb-0 d-flex align-items-center gap-2">
                    <Calendar size={14} /> 
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                    <span className="ms-2 d-flex align-items-center gap-1">
                      <Clock size={14} />
                      {new Date(order.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </p>
                </div>
                <div className="text-md-end">
                  <span className={`badge ${getStatusBadgeClass(order.status)} px-3 py-2 rounded-pill mb-2`}>
                    {order.status}
                  </span>
                  <p className="fw-bold fs-5 mb-0 text-success">
                    ₹{order.totalAmount?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="card-body p-3 p-md-4">
                <div className="row g-4">
                  <div className="col-12 col-md-8 border-md-end pe-md-4">
                    <h6 className="fw-bold mb-3 text-secondary text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                      Items in your order
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      {order.products.map((item, index) => (
                        <div key={index} className="d-flex align-items-center gap-3 bg-light p-3 rounded-3">
                          <div className="bg-white p-2 rounded border" style={{ width: '60px', height: '60px' }}>
                            <img 
                              src={item.product?.images?.[0] || item.product?.imageUrl || 'https://via.placeholder.com/60'} 
                              alt={item.product?.name || 'Product'} 
                              className="img-fluid w-100 h-100 object-fit-contain" 
                            />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="fw-bold mb-1 m-0">{item.product?.name || 'Unknown Product'}</h6>
                            <p className="text-muted small m-0">Qty: {item.quantity}</p>
                          </div>
                          <div className="fw-bold bg-white px-3 py-1 rounded shadow-sm">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-12 col-md-4 ps-md-4">
                    <h6 className="fw-bold mb-3 text-secondary text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                      Delivery Details
                    </h6>
                    <div className="bg-light p-3 rounded-3 h-100">
                      <div className="d-flex align-items-start gap-2 mb-2">
                        <MapPin size={18} className="text-success mt-1 flex-shrink-0" />
                        <p className="mb-0 small text-dark fw-medium lh-base">
                          {order.shippingAddress}
                        </p>
                      </div>
                      {order.status === 'Pending Prescription' && (
                        <div className="mt-3 p-2 bg-warning bg-opacity-25 border border-warning rounded">
                          <p className="mb-0 small text-dark fw-medium">
                            <i className="fas fa-exclamation-circle text-warning me-1"></i>
                            Action Required: Please check your email and ensure you verify your prescription via dashboard.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
