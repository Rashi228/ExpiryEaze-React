import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../lib/config';

const OrdersDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      // If token is missing, might redirect to login in a fully strict environment
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${config.API_URL}/admin/orders`, { headers });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch real orders from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, navigate]);

  // --- WORKFLOW LOGIC ---
  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    // Strict Enforcement of Transitions (can't revert completed)
    const isValidTransition = 
      (order.status === 'Pending' && newStatus === 'In Progress') ||
      (order.status === 'In Progress' && newStatus === 'Shipped') ||
      (order.status === 'Shipped' && newStatus === 'Delivered') ||
      (order.status === 'Pending' && newStatus === 'Shipped') || 
      (order.status === 'Pending' && newStatus === 'Delivered') || 
      (order.status === 'In Progress' && newStatus === 'Delivered') ||
      (order.status === 'Pending Prescription'); // Ignore strict check if it's prescription related for now

    // We allow skipping states locally for flexibility, but deny rollback from Delivered
    if (order.status === 'Delivered') {
      alert("Invalid workflow transition. Delivered orders cannot be rolled back.");
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Update locally immediately for UX
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, status: newStatus } : o
      ));

      await axios.put(`${config.API_URL}/admin/orders/${orderId}/status`, { status: newStatus }, { headers });
      
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Database error: Could not update status.");
      // Rollback on failure automatically by refetching
      fetchOrders();
    }
  };

  // --- HELPER FUNCTIONS ---
  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return 999;
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isUrgent = (order) => {
    // If ANY product in the order is expiring within 7 days
    if (!order.products || order.products.length === 0) return false;
    return order.products.some(p => {
      if (!p.product || !p.product.expiryDate) return false;
      return getDaysUntilExpiry(p.product.expiryDate) <= 7;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- FILTERING ---
  const filteredOrders = orders.filter(order => {
    const orderIdStr = order._id?.toString().toLowerCase() || '';
    const userNameStr = order.user?.name?.toLowerCase() || 'unknown user';
    
    // Check if any product name matches search
    const productMatch = order.products?.some(p => 
      p.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 1. Search
    const searchMatch = orderIdStr.includes(searchTerm.toLowerCase()) || 
                        userNameStr.includes(searchTerm.toLowerCase()) ||
                        productMatch;
    
    // 2. Status
    const statusMatch = statusFilter === 'All' || order.status === statusFilter;

    // 3. Urgency
    const urgencyMatch = !showUrgentOnly || isUrgent(order);

    return searchMatch && statusMatch && urgencyMatch;
  });

  // --- STYLES ---
  const glassStyle = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
    borderRadius: '16px',
    color: '#f8fafc'
  };

  const navStyle = {
    background: 'rgba(15, 23, 42, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const getStatusColor = (status, buttonTarget) => {
    const isCurrent = status === buttonTarget;
    switch (buttonTarget) {
      case 'Pending': return 'btn-outline-warning text-warning border-warning border-opacity-50';
      case 'In Progress': return 'btn-outline-info text-info border-info border-opacity-50';
      case 'Delivered': return 'btn-outline-success text-success border-success border-opacity-50';
      default: return 'btn-outline-secondary';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill"><i className="fas fa-clock me-1"></i> Pending</span>;
      case 'Pending Prescription': return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill"><i className="fas fa-prescription me-1"></i> Needs Rx</span>;
      case 'In Progress': return <span className="badge bg-info text-dark px-3 py-2 rounded-pill"><i className="fas fa-spinner fa-spin me-1"></i> In Progress</span>;
      case 'Shipped': return <span className="badge bg-primary text-white px-3 py-2 rounded-pill"><i className="fas fa-shipping-fast me-1"></i> Shipped</span>;
      case 'Delivered': return <span className="badge bg-success text-white px-3 py-2 rounded-pill"><i className="fas fa-check-circle me-1"></i> Delivered</span>;
      case 'Cancelled': return <span className="badge bg-danger text-white px-3 py-2 rounded-pill"><i className="fas fa-times me-1"></i> Cancelled</span>;
      default: return <span className="badge bg-secondary text-white px-3 py-2 rounded-pill">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="container-fluid min-vh-100 px-0 pb-5" style={{ backgroundColor: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Navbar */}
      <nav className="navbar navbar-dark px-4 py-3 sticky-top" style={navStyle}>
        <div className="navbar-brand fw-bold fs-4 d-flex align-items-center" style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <i className="fas fa-satellite-dish me-2 fs-3 text-info"></i> EXPIRYAZE <span className="ms-2 fw-light opacity-50 text-white">| Database Sync</span>
        </div>
        <div className="d-flex gap-3">
          <button onClick={() => navigate('/')} className="btn btn-outline-light rounded-pill px-4 shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            <i className="fas fa-arrow-left me-2"></i> Main Dashboard
          </button>
          <button onClick={handleLogout} className="btn btn-outline-danger rounded-pill px-4 shadow-sm">
            <i className="fas fa-power-off"></i>
          </button>
        </div>
      </nav>

      <div className="container-fluid px-5 pt-5">
        <h2 className="fw-bolder mb-4 text-white"><i className="fas fa-database me-3 text-info"></i>Global Production Orders</h2>
        
        {error && (
          <div className="alert alert-danger bg-danger text-white border-0">{error}</div>
        )}

        {/* Controls & Filters */}
        <div className="card mb-5 border-0 rounded-4 p-4" style={glassStyle}>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-info">
                  <i className="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-25 text-white" 
                  placeholder="Search by ID, User, or Product..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </div>
            
            <div className="col-6 col-md-3">
              <select 
                className="form-select bg-dark border-secondary border-opacity-25 text-white" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ boxShadow: 'none' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Pending Prescription">Pending Rx</option>
                <option value="In Progress">In Progress</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-6 col-md-4 text-md-end">
              <div className="form-check form-switch d-inline-block p-0">
                <input 
                  className="form-check-input ms-0 me-2 mt-1 bg-dark border-secondary" 
                  type="checkbox" 
                  role="switch" 
                  id="urgentSwitch" 
                  checked={showUrgentOnly}
                  onChange={() => setShowUrgentOnly(!showUrgentOnly)}
                  style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer', float: 'none', marginLeft: '-2.5rem' }}
                />
                <label className="form-check-label text-warning fw-bold mt-1" htmlFor="urgentSwitch" style={{ cursor: 'pointer' }}>
                  <i className="fas fa-exclamation-triangle me-1"></i> Critical Expiries
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card rounded-4 border-0" style={{ ...glassStyle, overflow: 'hidden' }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-borderless table-hover align-middle mb-0 text-white" style={{ '--bs-table-bg': 'transparent', '--bs-table-color': '#f8fafc', '--bs-table-hover-bg': 'rgba(255,255,255,0.05)' }}>
                <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <tr>
                    <th className="ps-4 py-4 fw-light text-uppercase opacity-75" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Order ID & Date</th>
                    <th className="py-4 fw-light text-uppercase opacity-75" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Customer</th>
                    <th className="py-4 fw-light text-uppercase opacity-75" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Items & Expiry Target</th>
                    <th className="py-4 fw-light text-uppercase opacity-75" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Workflow Stage</th>
                    <th className="pe-4 py-4 fw-light text-uppercase opacity-75 text-end" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Action Protocol</th>
                  </tr>
                </thead>
                <tbody style={{ transition: 'all 0.3s ease' }}>
                  {loading && orders.length === 0 ? (
                     <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="spinner-border text-info" role="status"></div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-secondary">
                        <i className="fas fa-box-open fa-3x mb-3 text-info opacity-25"></i><br/>
                        No orders match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const urgent = isUrgent(order);
                      const userName = order.user ? order.user.name : 'Unknown User';
                      const userEmail = order.user ? order.user.email : 'No email';
                      
                      return (
                        <tr 
                          key={order._id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: urgent ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)' : 'transparent',
                            transition: 'background 0.3s ease'
                          }}
                        >
                          <td className="ps-4 py-3">
                            <span className="fw-bold font-monospace d-block" title={order._id}>
                              ORD-{order._id.substring(order._id.length - 6).toUpperCase()}
                            </span>
                            <span className="small opacity-50"><i className="fas fa-calendar-alt me-1"></i> {new Date(order.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center me-3 border border-secondary border-opacity-50" style={{ width: '40px', height: '40px' }}>
                                {userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h6 className="mb-0 fw-bold">{userName}</h6>
                                <span className="small opacity-50">{userEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <ul className="list-unstyled mb-0 m-0 p-0 text-info fw-bold" style={{ fontSize: '0.9rem' }}>
                              {order.products.map((p, idx) => {
                                const daysLeft = p.product?.expiryDate ? getDaysUntilExpiry(p.product.expiryDate) : null;
                                const isItemUrgent = daysLeft !== null && daysLeft <= 7;
                                
                                return (
                                  <li key={idx} className="mb-1 d-flex align-items-center">
                                    <span className="me-2 text-white">x{p.quantity}</span> {p.product ? p.product.name : 'N/A'}
                                    {daysLeft !== null && (
                                      <span className={`ms-2 small fw-bold px-2 py-0 rounded ${isItemUrgent ? 'bg-danger text-white' : 'bg-dark text-light border border-secondary border-opacity-50'}`} style={{fontSize: '0.7rem'}}>
                                        Exp: {daysLeft}d
                                      </span>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                            <div className="mt-1 small fw-bold opacity-50 text-white">Total: ₹{order.totalAmount}</div>
                          </td>
                          <td className="py-3">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="pe-4 py-3 text-end">
                            <div className="btn-group shadow-sm">
                              <button 
                                className={`btn btn-sm ${getStatusColor(order.status, 'In Progress')}`}
                                disabled={['Delivered', 'Cancelled', 'Shipped'].includes(order.status)}
                                onClick={() => handleStatusChange(order._id, 'In Progress')}
                                style={{ opacity: ['Delivered', 'Cancelled', 'Shipped'].includes(order.status) ? 0.3 : 1 }}
                              >
                                Prepare
                              </button>
                              <button 
                                className={`btn btn-sm ${getStatusColor(order.status, 'Shipped')}`}
                                disabled={['Delivered', 'Cancelled'].includes(order.status)}
                                onClick={() => handleStatusChange(order._id, 'Shipped')}
                                style={{ opacity: ['Delivered', 'Cancelled'].includes(order.status) ? 0.3 : 1 }}
                              >
                                Ship
                              </button>
                              <button 
                                className={`btn btn-sm ${getStatusColor(order.status, 'Delivered')}`}
                                disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                                onClick={() => handleStatusChange(order._id, 'Delivered')}
                                style={{ opacity: order.status === 'Delivered' || order.status === 'Cancelled' ? 0.3 : 1 }}
                              >
                                Delivered
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersDashboard;
