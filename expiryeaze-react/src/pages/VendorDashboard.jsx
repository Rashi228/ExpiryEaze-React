import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { config } from '../lib/config';
import { PlusCircle, Edit, Trash2, Eye, Menu, AlertCircle } from 'lucide-react';
import VendorProfileSidebar from '../components/VendorProfileSidebar';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [productToShowPhotos, setProductToShowPhotos] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${config.API_URL}/products`);
      
      if (res.data.success) {
        const vendorProducts = res.data.data.filter((product) => {
          const vendor = product.vendor;
          if (vendor && typeof vendor === 'object') {
            return vendor._id === user?.id;
          }
          return vendor === user?.id;
        });
        setProducts(vendorProducts);
      } else {
        setError('Failed to fetch products.');
      }
    } catch (err) {
      setError('An error occurred while fetching products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Fetch vendor profile for enforcement
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${config.API_URL}/vendors/profile`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setProfile(res.data.profile);
      } catch (err) {
        setProfileError('Failed to load profile');
        console.error('Profile fetch error:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`${config.API_URL}/products/${productToDelete._id}`);
      setProducts(products.filter(p => p._id !== productToDelete._id));
    } catch (err) {
      setError('Failed to delete product.');
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const handleEditClick = (productId) => {
    navigate(`/edit-product/${productId}`);
  };

  const handleViewPhotosClick = (product) => {
    setProductToShowPhotos(product);
    setShowPhotosModal(true);
  };

  const handleAddProductClick = () => {
    if (profileLoading) return;
    
    if (!profile || !profile.profileCompleted) {
      setShowProfileModal(true);
      return;
    }
    
    navigate('/add-product');
  };

  const getStockLevel = (stock) => {
    if (stock === 0) {
      return <span className="badge bg-danger">Out of Stock</span>;
    }
    if (stock <= 20) {
      return <span className="badge bg-warning text-dark">Low</span>;
    }
    return <span className="badge bg-success">High</span>;
  };
  
  const calculateDiscountPercent = (price, discountedPrice) => {
    return Math.round(((price - discountedPrice) / price) * 100);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger mt-5">{error}</div>;
  }

  return (
    <div className="container-fluid py-4">
      {/* Floating Hamburger Menu */}
      <button
        className="btn btn-light position-fixed shadow"
        style={{ top: '20px', left: '20px', zIndex: 1000, borderRadius: '50%', width: '50px', height: '50px' }}
        onClick={() => setSidebarOpen(true)}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Profile Sidebar */}
      <VendorProfileSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} onProfileUpdated={() => {
        // Re-fetch profile after update
        setProfileLoading(true);
        setProfileError("");
        const fetchProfile = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/vendors/profile`, { headers: { Authorization: `Bearer ${token}` } });
            setProfile(res.data.profile);
          } catch (err) {
            setProfileError('Failed to load profile');
          } finally {
            setProfileLoading(false);
          }
        };
        fetchProfile();
      }} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 fw-bold">Your Product Inventory</h1>
        <button
          className="btn btn-success d-flex align-items-center gap-2"
          onClick={handleAddProductClick}
          disabled={profileLoading}
          title={profile && !profile.profileCompleted ? 'Complete your profile to add products' : ''}
        >
          <PlusCircle size={20} />
          Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-5 border rounded-3 bg-light">
          <h4>No Products Found</h4>
          <p className="text-muted">Get started by adding your first product.</p>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Category</th>
                    <th scope="col">Price</th>
                    <th scope="col">Discounted Price</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Stock Level</th>
                    <th scope="col">Expiry Date</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const discountPercent = product.discountedPrice && product.discountedPrice < product.price 
                      ? calculateDiscountPercent(product.price, product.discountedPrice) 
                      : null;

                    return (
                      <tr key={product._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="position-relative">
                              <img
                                src={product.imageUrl || 'https://via.placeholder.com/60'}
                                alt={product.name}
                                className="me-3 rounded"
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                              />
                              {discountPercent && (
                                <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-danger">
                                  {discountPercent}%
                                </span>
                              )}
                            </div>
                            <span className="fw-semibold">{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>{product.discountedPrice ? `$${product.discountedPrice.toFixed(2)}` : 'N/A'}</td>
                        <td className="fw-bold">{product.stock}</td>
                        <td>{getStockLevel(product.stock)}</td>
                        <td>{new Date(product.expiryDate).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleViewPhotosClick(product)}><Eye size={16} /></button>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(product._id)}><Edit size={16} /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(product)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <AlertCircle className="text-warning" size={24} />
                  Complete Your Profile
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowProfileModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>You need to complete your vendor profile before you can add products.</p>
                <p className="text-muted small">Please provide all required information including your business details, contact information, and verification documents.</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  setShowProfileModal(false);
                  setSidebarOpen(true);
                }}>
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the product: <strong>{productToDelete.name}</strong>?</p>
                <p className="text-danger">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Photos Modal */}
      {showPhotosModal && productToShowPhotos && (
        <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Photos for {productToShowPhotos.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPhotosModal(false)}></button>
              </div>
              <div className="modal-body">
                {productToShowPhotos.images && productToShowPhotos.images.length > 0 ? (
                  <div className="row g-3">
                    {productToShowPhotos.images.map((image, index) => (
                      <div className="col-md-4" key={index}>
                        <img src={image} alt={`${productToShowPhotos.name} - ${index + 1}`} className="img-fluid rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center">No additional photos available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPhotosModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
