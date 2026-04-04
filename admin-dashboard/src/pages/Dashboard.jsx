import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { config } from '../lib/config';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    totalUsers: 0, totalVendors: 0, pendingVerifications: 0,
    totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    ordersByStatus: {}, productsByCategory: {}
  });
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      const statsRes = await axios.get(`${config.API_URL}/admin/stats`, { headers });
      setStats(statsRes.data.data);

      const verificationsRes = await axios.get(`${config.API_URL}/admin/medicine-verifications?status=pending`, { headers });
      setVerifications(verificationsRes.data.data);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${config.API_URL}/admin/medicine-verifications/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchDashboardData();
    } catch (err) {
      alert("Error approving application");
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${config.API_URL}/admin/medicine-verifications/${id}/reject`, { reviewNotes: "Rejected by admin" }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchDashboardData();
    } catch (err) {
      alert("Error rejecting application");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#0f172a' }}>
        <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }} role="status"></div>
      </div>
    );
  }

  // Chart Data preparation
  const categoryLabels = Object.keys(stats.productsByCategory || {});
  const categoryData = Object.values(stats.productsByCategory || {});
  const doughnutData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['No Data'],
    datasets: [{
      data: categoryData.length > 0 ? categoryData : [1],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const orderStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
  const orderDataArray = orderStatuses.map(status => (stats.ordersByStatus || {})[status] || 0);
  const barData = {
    labels: orderStatuses,
    datasets: [{
      label: 'Orders',
      data: orderDataArray,
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } },
      title: { display: false }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8', beginAtZero: true }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  // Glassmorphism pure custom styles
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

  return (
    <div className="container-fluid min-vh-100 px-0 pb-5" style={{ backgroundColor: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Navbar */}
      <nav className="navbar navbar-dark px-4 py-3 sticky-top" style={navStyle}>
        <div className="navbar-brand fw-bold fs-4 d-flex align-items-center" style={{ color: '#38bdf8' }}>
          <i className="fas fa-satellite-dish me-2 fs-3 text-info"></i> EXPIRYAZE <span className="ms-2 fw-light opacity-50 text-white">| Command Center</span>
        </div>
        <button onClick={handleLogout} className="btn btn-outline-info rounded-pill px-4 fw-bold shadow-sm" style={{ border: '2px solid' }}>
          Initialize Shutdown <i className="fas fa-power-off ms-2"></i>
        </button>
      </nav>

      <div className="container-fluid px-5 pt-5">
        <h2 className="fw-bolder mb-4 text-white">System Logs & Analytics</h2>
        {error && <div className="alert alert-danger bg-danger text-white border-0">{error}</div>}

        {/* Big Analytics Cards */}
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-6 col-xl-4">
            <div className="card h-100" style={{ ...glassStyle, borderLeft: '4px solid #38bdf8' }}>
              <div className="card-body d-flex justify-content-between align-items-center p-4">
                <div>
                  <h6 className="text-uppercase fw-bold mb-1 opacity-75" style={{ color: '#38bdf8', letterSpacing: '1px', fontSize: '0.85rem' }}>Network Users</h6>
                  <h2 className="display-5 fw-bolder mb-0 text-white">{stats.totalUsers}</h2>
                </div>
                <div className="rounded-circle d-flex justify-content-center align-items-center shadow-lg" style={{ width: '60px', height: '60px', background: 'rgba(56, 189, 248, 0.1)' }}>
                  <i className="fas fa-users fa-2x" style={{ color: '#38bdf8' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-4">
            <div className="card h-100" style={{ ...glassStyle, borderLeft: '4px solid #34d399' }}>
              <div className="card-body d-flex justify-content-between align-items-center p-4">
                <div>
                  <h6 className="text-uppercase fw-bold mb-1 opacity-75" style={{ color: '#34d399', letterSpacing: '1px', fontSize: '0.85rem' }}>Verified Vendors</h6>
                  <h2 className="display-5 fw-bolder mb-0 text-white">{stats.totalVendors}</h2>
                </div>
                <div className="rounded-circle d-flex justify-content-center align-items-center shadow-lg" style={{ width: '60px', height: '60px', background: 'rgba(52, 211, 153, 0.1)' }}>
                  <i className="fas fa-store-alt fa-2x" style={{ color: '#34d399' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-4">
            <div className="card h-100" style={{ ...glassStyle, borderLeft: '4px solid #f472b6' }}>
              <div className="card-body d-flex justify-content-between align-items-center p-4">
                <div>
                  <h6 className="text-uppercase fw-bold mb-1 opacity-75" style={{ color: '#f472b6', letterSpacing: '1px', fontSize: '0.85rem' }}>Global Products</h6>
                  <h2 className="display-5 fw-bolder mb-0 text-white">{stats.totalProducts}</h2>
                </div>
                <div className="rounded-circle d-flex justify-content-center align-items-center shadow-lg" style={{ width: '60px', height: '60px', background: 'rgba(244, 114, 182, 0.1)' }}>
                  <i className="fas fa-box-open fa-2x" style={{ color: '#f472b6' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-4">
            <div className="card h-100" style={{ ...glassStyle, borderLeft: '4px solid #fbbf24' }}>
              <div className="card-body d-flex justify-content-between align-items-center p-4">
                <div>
                  <h6 className="text-uppercase fw-bold mb-1 opacity-75" style={{ color: '#fbbf24', letterSpacing: '1px', fontSize: '0.85rem' }}>Pending Pharmaceuticals</h6>
                  <h2 className="display-5 fw-bolder mb-0 text-white">{stats.pendingVerifications}</h2>
                </div>
                <div className="rounded-circle d-flex justify-content-center align-items-center shadow-lg" style={{ width: '60px', height: '60px', background: 'rgba(251, 191, 36, 0.1)' }}>
                  <i className="fas fa-file-medical fa-2x" style={{ color: '#fbbf24' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-4">
            <div className="card h-100" style={{ ...glassStyle, borderLeft: '4px solid #a78bfa' }}>
              <div className="card-body d-flex justify-content-between align-items-center p-4">
                <div>
                  <h6 className="text-uppercase fw-bold mb-1 opacity-75" style={{ color: '#a78bfa', letterSpacing: '1px', fontSize: '0.85rem' }}>Platform Orders</h6>
                  <h2 className="display-5 fw-bolder mb-0 text-white">{stats.totalOrders}</h2>
                </div>
                <div className="rounded-circle d-flex justify-content-center align-items-center shadow-lg" style={{ width: '60px', height: '60px', background: 'rgba(167, 139, 250, 0.1)' }}>
                  <i className="fas fa-shipping-fast fa-2x" style={{ color: '#a78bfa' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-4">
            <div className="card h-100" style={{ ...glassStyle, borderLeft: '4px solid #2dd4bf' }}>
              <div className="card-body d-flex justify-content-between align-items-center p-4">
                <div>
                  <h6 className="text-uppercase fw-bold mb-1 opacity-75" style={{ color: '#2dd4bf', letterSpacing: '1px', fontSize: '0.85rem' }}>Gross Revenue</h6>
                  <h2 className="display-5 fw-bolder mb-0 text-white">${stats.totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="rounded-circle d-flex justify-content-center align-items-center shadow-lg" style={{ width: '60px', height: '60px', background: 'rgba(45, 212, 191, 0.1)' }}>
                  <i className="fas fa-coins fa-2x" style={{ color: '#2dd4bf' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-5">
          <div className="col-xl-4">
            <div className="card h-100" style={glassStyle}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-white opacity-75"><i className="fas fa-chart-pie me-2 text-info"></i> Product Ecosystem</h5>
                <div style={{ height: '300px' }}>
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-8">
            <div className="card h-100" style={glassStyle}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-white opacity-75"><i className="fas fa-chart-bar me-2 text-primary"></i> Live Order Telemetry</h5>
                <div style={{ height: '300px' }}>
                  <Bar data={barData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Verifications Table Queue */}
        <div className="card mt-4" style={{ ...glassStyle, overflow: 'hidden' }}>
          <div className="card-header border-bottom-0 py-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <h4 className="fw-bold mb-0 text-white"><i className="fas fa-clipboard-list me-2 text-warning"></i> Action Required: Pharmacy Queue</h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-borderless table-hover align-middle mb-0 text-white" style={{ '--bs-table-bg': 'transparent', '--bs-table-color': '#f8fafc', '--bs-table-hover-bg': 'rgba(255,255,255,0.05)' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th className="ps-4 py-3 fw-light text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Business Name</th>
                    <th className="py-3 fw-light text-uppercase">Type</th>
                    <th className="py-3 fw-light text-uppercase">Email</th>
                    <th className="py-3 fw-light text-uppercase">License No.</th>
                    <th className="py-3 fw-light text-uppercase">Submitted</th>
                    <th className="text-end pe-4 py-3 fw-light text-uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-secondary">
                        <i className="fas fa-check-circle fa-3x mb-3 text-success opacity-50"></i><br/>
                        All pharmacy verifications have been processed. Queue is empty.
                      </td>
                    </tr>
                  ) : (
                    verifications.map(app => (
                      <tr key={app._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="ps-4 fw-bold">{app.businessName}</td>
                        <td><span className="badge rounded-pill bg-info text-dark text-capitalize px-3 py-2">{app.businessType}</span></td>
                        <td className="opacity-75">{app.email}</td>
                        <td className="text-warning"><i className="fas fa-file-signature me-2"></i>{app.pharmacyLicense}</td>
                        <td className="opacity-75">{new Date(app.submittedAt).toLocaleDateString()}</td>
                        <td className="text-end pe-4">
                          <button 
                            className="btn btn-sm btn-info rounded-pill px-4 fw-bold shadow-sm"
                            onClick={() => { setSelectedApp(app); setShowModal(true); }}
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Modal Overlay */}
      {showModal && selectedApp && (
        <div className="modal show fade d-block w-100 h-100" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content text-white" style={{ ...glassStyle, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <div className="modal-header border-bottom-0 py-4 px-5 bg-black bg-opacity-25">
                <h4 className="modal-title fw-bold text-info"><i className="fas fa-search me-3"></i>Security Audit: {selectedApp.businessName}</h4>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-5">
                <div className="row g-5">
                  
                  {/* Business Card Info */}
                  <div className="col-md-6">
                    <div className="p-4 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h5 className="fw-bold text-info mb-4 text-uppercase" style={{ letterSpacing: '2px' }}><i className="fas fa-building me-2"></i>Entity Log</h5>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Registered Name</span> <span className="fw-bold">{selectedApp.businessName}</span>
                      </div>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Market Type</span> <span className="text-capitalize badge bg-info text-dark">{selectedApp.businessType}</span>
                      </div>
                      <div className="mb-3 d-flex justify-content-between pb-2">
                        <span className="opacity-50">HQ Address</span> <span className="text-end" style={{ maxWidth: '60%' }}>{selectedApp.businessAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Licensing Profile */}
                  <div className="col-md-6">
                    <div className="p-4 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h5 className="fw-bold text-warning mb-4 text-uppercase" style={{ letterSpacing: '2px' }}><i className="fas fa-certificate me-2"></i>Legal & Compliance</h5>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">State Business Reg</span> <span className="fw-bold font-monospace">{selectedApp.licenseNumber}</span>
                      </div>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Medical License</span> <span className="fw-bold font-monospace text-warning">{selectedApp.pharmacyLicense}</span>
                      </div>
                      <div className="mb-3 d-flex justify-content-between pb-2">
                        <span className="opacity-50">Compliance Exec</span> <span><i className="fas fa-user-tie me-2 text-info"></i>{selectedApp.complianceOfficer}</span>
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure Overview */}
                  <div className="col-md-6">
                    <div className="p-4 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h5 className="fw-bold text-success mb-4 text-uppercase" style={{ letterSpacing: '2px' }}><i className="fas fa-warehouse me-2"></i>Infrastructure</h5>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Primary Facility</span> <span className="text-end">{selectedApp.storageFacility}</span>
                      </div>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Climate System</span> <span className="badge bg-success bg-opacity-25 border border-success text-success"><i className="fas fa-snowflake me-2"></i>{selectedApp.temperatureControl}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Grid */}
                  <div className="col-md-6">
                     <div className="p-4 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h5 className="fw-bold text-danger mb-4 text-uppercase" style={{ letterSpacing: '2px' }}><i className="fas fa-shield-alt me-2"></i>Security Perimeter</h5>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Provider</span> <span className="fw-bold">{selectedApp.insuranceProvider}</span>
                      </div>
                      <div className="mb-3 d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-25">
                        <span className="opacity-50">Policy No.</span> <span className="font-monospace text-muted">{selectedApp.insurancePolicyNumber}</span>
                      </div>
                      <div className="bg-black bg-opacity-25 p-3 rounded-3 mt-3 border border-danger border-opacity-50 rounded" style={{ fontSize: '0.9rem' }}>
                         <span className="text-danger fw-bold d-block mb-1"><i className="fas fa-lock me-2"></i>Active Security Detail:</span>
                         <span className="opacity-75">{selectedApp.securityMeasures}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer border-top-0 p-5 bg-black bg-opacity-25 d-flex justify-content-between">
                <button type="button" className="btn btn-outline-light rounded-pill px-5 fw-bold" onClick={() => setShowModal(false)}>Abort Sequence</button>
                <div>
                  <button type="button" className="btn btn-danger rounded-pill fw-bold px-5 py-2 me-3 shadow-lg" onClick={() => handleReject(selectedApp._id)}>
                    <i className="fas fa-ban me-2"></i> Decline Entity
                  </button>
                  <button type="button" className="btn btn-success rounded-pill fw-bold px-5 py-2 shadow-lg" onClick={() => handleApprove(selectedApp._id)}>
                    <i className="fas fa-check-double me-2"></i> Authorize Level-1 Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
