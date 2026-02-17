import React, { useEffect, useState, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Star, ShoppingCart, Search, MapPin, Building, CalendarCheck2, MessageCircle, Package } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReviewSection from '../components/ReviewSection';
import { config } from '../lib/config';
import { GROCERY_CATEGORIES } from '../lib/constants';

const PLACEHOLDER = 'https://via.placeholder.com/300x200.png?text=No+Image';

const UserDashboard = () => {
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedVendorId, setSelectedVendorId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('name');
  const [tab, setTab] = useState('products');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const navigate = useNavigate();

  // Local quantity state for products not yet in cart
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await axios.get(`${config.API_URL}/products`);
        if (res.data.success) {
          setProducts(res.data.data.filter((p) => GROCERY_CATEGORIES.includes(p.category)));
        }
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchVendors() {
      setVendorsLoading(true);
      try {
        const res = await axios.get(`${config.API_URL}/vendors/all-with-products`);
        if (res.data.success) {
          setVendors(res.data.data);
        }
      } catch (err) {
        // handle error
      } finally {
        setVendorsLoading(false);
      }
    }
    fetchVendors();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => selectedCity === 'all' || p.city === selectedCity)
      .filter(p => {
        if (selectedVendorId === 'all') return true;
        const productVendorId = (p.vendor && typeof p.vendor === 'object') ? p.vendor._id : p.vendor;
        return productVendorId === selectedVendorId;
      });

    switch (sortOrder) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'expiry_asc':
        result.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        break;
      default: // name
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, searchTerm, selectedCity, selectedVendorId, sortOrder]);

  const getCities = () => {
    // Predefined list of major Indian cities for filtering
    const predefinedCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur'
    ];

    // Get cities from existing products
    const productCities = Array.from(new Set(products.map(p => p.city).filter(city => city)));

    // Combine predefined cities with product cities and remove duplicates
    const allCities = [...new Set([...predefinedCities, ...productCities])];

    return ['all', ...allCities.sort()];
  };

  const getVendors = () => {
    return vendors.map(({ vendor }) => ({
      id: vendor._id,
      name: vendor.name
    }));
  };

  const toggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCarouselIndex(0);
    setModalOpen(true);
  };

  const closeProductModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    // Check if user is signed in
    if (!user) {
      setNotification('Please sign in to purchase products!');
      setTimeout(() => {
        setNotification('');
        navigate('/login');
      }, 2000);
      return;
    }

    // Check if user has joined waitlist as "user" role
    try {
      const checkResponse = await axios.get(`${config.API_URL}/auth/waitlist/check`, {
        params: {
          email: user.email,
          role: 'user'
        }
      });

      if (!checkResponse.data.joined) {
        setNotification('Please join the waitlist as a user to add products to cart!');
        setTimeout(() => {
          setNotification('');
          navigate('/join-waitlist');
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('Error checking waitlist:', error);
      // If API fails, check if user has role set (fallback)
      if (!user.role || user.role !== 'user') {
        setNotification('Please join the waitlist as a user to add products to cart!');
        setTimeout(() => {
          setNotification('');
          navigate('/join-waitlist');
        }, 2000);
        return;
      }
    }

    // If user is signed in and has joined waitlist as user, add to cart
    try {
      await addToCart(productId, quantity);
      setNotification('Product added to cart successfully!');
      setTimeout(() => setNotification(''), 3000);
      // Reset local quantity after add
      setQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (error) {
      setNotification(error.message || 'Failed to add product to cart.');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Quantity helpers (sync with cart when present)
  const getQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.product && item.product._id === productId);
    if (cartItem) return cartItem.quantity;
    return quantities[productId] || 1;
  };

  const handleQuantityChange = (productId, change) => {
    const cartItem = cartItems.find(item => item.product && item.product._id === productId);
    if (cartItem) {
      const newQty = Math.max(0, cartItem.quantity + change);
      updateQuantity(cartItem._id || cartItem.id, newQty);
    } else {
      setQuantities(prev => {
        const current = prev[productId] || 1;
        const next = Math.max(1, current + change);
        return { ...prev, [productId]: next };
      });
    }
  };

  const calculateDaysLeft = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateDiscountPercent = (price, discountedPrice) => {
    if (!discountedPrice || discountedPrice >= price) return 0;
    return Math.round(((price - discountedPrice) / price) * 100);
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className="container py-5">
      {notification && (
        <div className="alert alert-success position-fixed top-0 end-0 m-3" style={{ zIndex: 1060 }}>
          {notification}
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold fs-2">Browse Groceries</h1>
        <button className="btn btn-outline-success" onClick={() => navigate('/cart')}>
          View Cart ({cartItems.length})
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <div className="nav nav-pills bg-light rounded p-1" role="tablist">
          <button
            className={`nav-link d-flex align-items-center gap-2 px-4 py-2 fw-semibold ${tab === 'products' ? 'active' : ''
              }`}
            style={{
              backgroundColor: tab === 'products' ? '#198754' : 'transparent',
              color: tab === 'products' ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'products' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (tab !== 'products') {
                e.target.style.backgroundColor = '#e9ecef';
                e.target.style.color = '#198754';
                e.target.style.transform = 'translateY(-1px)';
              } else {
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== 'products') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6c757d';
                e.target.style.transform = 'translateY(0)';
              } else {
                e.target.style.transform = 'translateY(0)';
              }
            }}
            onClick={() => setTab('products')}
          >
            <Package size={18} />
            Products
          </button>
          <button
            className={`nav-link d-flex align-items-center gap-2 px-4 py-2 fw-semibold ${tab === 'vendors' ? 'active' : ''
              }`}
            style={{
              backgroundColor: tab === 'vendors' ? '#198754' : 'transparent',
              color: tab === 'vendors' ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'vendors' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (tab !== 'vendors') {
                e.target.style.backgroundColor = '#e9ecef';
                e.target.style.color = '#198754';
                e.target.style.transform = 'translateY(-1px)';
              } else {
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== 'vendors') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6c757d';
                e.target.style.transform = 'translateY(0)';
              } else {
                e.target.style.transform = 'translateY(0)';
              }
            }}
            onClick={() => setTab('vendors')}
          >
            <Building size={18} />
            Vendors
          </button>
        </div>
      </div>

      {/* Filters - Moved to top */}
      {tab === 'products' && (
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex flex-wrap gap-3 align-items-center">
            <div className="input-group flex-grow-1" style={{ minWidth: '200px' }}>
              <span className="input-group-text bg-white"><Search size={18} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: 'auto' }} value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
              <option key="all-cities" value="all">All Cities</option>
              {getCities().map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
              <option key="all-vendors" value="all">All Vendors</option>
              {getVendors().map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option key="sort-name" value="name">Sort by Name</option>
              <option key="sort-price-asc" value="price_asc">Sort by Price (Low to High)</option>
              <option key="sort-price-desc" value="price_desc">Sort by Price (High to Low)</option>
              <option key="sort-expiry-asc" value="expiry_asc">Sort by Expiry (Soonest)</option>
            </select>
            <span className="text-muted fw-semibold">{filteredAndSortedProducts.length} found</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('all');
                setSelectedVendorId('all');
                setSortOrder('name');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      {tab === 'vendors' && (
        <div>
          {vendorsLoading ? (
            <div className="p-5 text-center">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="p-5 text-center text-muted">No vendors found.</div>
          ) : (
            <div className="row g-4">
              {vendors.map(({ vendor, products }) => (
                <div className="col-md-6 col-lg-4" key={vendor._id}>
                  <div className="card shadow-sm">
                    <div className="card-body p-3">
                      <div className="text-center mb-2">
                        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                          style={{ width: '60px', height: '60px' }}>
                          <Building size={24} className="text-success" />
                        </div>
                        <h6 className="fw-bold mb-1">{vendor.name}</h6>
                        <p className="text-muted small mb-2">{vendor.email}</p>
                      </div>

                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small">Products:</span>
                          <span className="fw-semibold small">{products.length}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small">Location:</span>
                          <span className="fw-semibold small">{vendor.city || 'N/A'}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted small">Phone:</span>
                          <span className="fw-semibold small">{vendor.phone || 'N/A'}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Category:</span>
                          <span className="badge bg-success small">{vendor.category || 'General'}</span>
                        </div>
                      </div>

                      {vendor.description && (
                        <p className="text-muted small mb-2">{vendor.description}</p>
                      )}

                      <div className="d-grid gap-1">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setTab('products');
                            setSelectedVendorId(vendor._id);
                            setSearchTerm(''); // Clear search term
                          }}
                        >
                          Browse Products
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            alert(`Contact ${vendor.name}:\nEmail: ${vendor.email}\nPhone: ${vendor.phone || 'N/A'}\nLocation: ${vendor.city || 'N/A'}`);
                          }}
                        >
                          Contact
                        </button>
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() => {
                            setExpandedVendor(expandedVendor === vendor._id ? null : vendor._id);
                          }}
                        >
                          {expandedVendor === vendor._id ? 'Hide Reviews' : 'View Reviews'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Reviews Section */}
                  {expandedVendor === vendor._id && (
                    <div className="mt-2">
                      <ReviewSection
                        vendorId={vendor._id}
                        vendorName={vendor.name}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Display */}
      {tab === 'products' && (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredAndSortedProducts.length > 0 ? (
            filteredAndSortedProducts.map(product => (
              <div key={product._id} className="col">
                <div className="card h-100 shadow-sm border-0">
                  <div className="position-relative">
                    <img
                      src={product.images?.[0] || product.imageUrl || PLACEHOLDER}
                      className="card-img-top"
                      alt={product.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    {calculateDiscountPercent(product.price, product.discountedPrice) > 0 && (
                      <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                        {calculateDiscountPercent(product.price, product.discountedPrice)}% Off
                      </span>
                    )}
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold text-truncate mb-1">{product.name}</h5>
                    <p className="card-text text-muted small mb-2">{product.category}</p>
                    <div className="d-flex align-items-center mb-2">
                      {product.discountedPrice && product.discountedPrice < product.price ? (
                        <>
                          <span className="fw-bold text-success fs-5 me-2">₹{product.discountedPrice.toFixed(2)}</span>
                          <span className="text-muted text-decoration-line-through me-2">₹{product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="fw-bold text-success fs-5">₹{product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center text-muted small mb-2">
                      <CalendarCheck2 size={14} className="me-1" />
                      Expires in {calculateDaysLeft(product.expiryDate)} days
                    </div>
                    <div className="d-flex align-items-center text-muted small mb-3">
                      <Building size={14} className="me-1" />
                      Vendor: {product?.vendor?.name || 'N/A'}
                    </div>
                    <div className="mt-auto d-flex flex-column gap-2">
                      {/* Quantity selector */}
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleQuantityChange(product._id, -1)}
                          style={{ width: '32px', height: '32px', padding: 0 }}
                        >
                          -
                        </button>
                        <span className="fw-bold" style={{ minWidth: '30px', textAlign: 'center' }}>
                          {getQuantity(product._id)}
                        </span>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleQuantityChange(product._id, 1)}
                          style={{ width: '32px', height: '32px', padding: 0 }}
                        >
                          +
                        </button>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                          onClick={() => openProductModal(product)}
                        >
                          View Details
                        </button>
                        <button
                          className={`btn btn-sm flex-grow-1 ${cartItems.some(ci => ci.product && ci.product._id === product._id) ? 'btn-secondary' : 'btn-success'}`}
                          disabled={cartItems.some(ci => ci.product && ci.product._id === product._id)}
                          onClick={() => handleAddToCart(product._id, getQuantity(product._id))}
                        >
                          {cartItems.some(ci => ci.product && ci.product._id === product._id)
                            ? 'In Cart'
                            : `Add ${getQuantity(product._id)} to Cart`}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <p className="text-muted fs-4">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      )}



      {/* Product Details Modal */}
      {selectedProduct && modalOpen && (
        <div className="modal show fade d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedProduct.name}</h5>
                <button type="button" className="btn-close" onClick={closeProductModal}></button>
              </div>
              <div className="modal-body">
                {/* Carousel */}
                <div className="mb-3 text-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <>
                      <img
                        src={selectedProduct.images[carouselIndex]}
                        alt={selectedProduct.name}
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: 300 }}
                      />
                      {selectedProduct.images.length > 1 && (
                        <div className="d-flex justify-content-center gap-2 mt-2">
                          {selectedProduct.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="thumb"
                              className={`img-thumbnail ${carouselIndex === idx ? 'border-success' : ''}`}
                              style={{ width: 50, height: 50, objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => setCarouselIndex(idx)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src={selectedProduct.imageUrl || PLACEHOLDER}
                      alt={selectedProduct.name}
                      className="img-fluid rounded mb-2"
                      style={{ maxHeight: 300 }}
                    />
                  )}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Vendor:</span> {selectedProduct.vendor?.name || 'In-house'}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Location:</span> {selectedProduct.city}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Expiry:</span> {selectedProduct.expiryDate ? new Date(selectedProduct.expiryDate).toLocaleDateString() : '-'}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Price:</span> ₹{selectedProduct.price?.toFixed(2)}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Stock:</span> {selectedProduct.stock ?? selectedProduct.quantity ?? 0}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Description:</span> {selectedProduct.description}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Discount:</span> {selectedProduct.discount || 'N/A'}
                </div>
                <div className="mb-2 d-flex align-items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      color={i < Math.round(selectedProduct.rating || 0) ? '#facc15' : '#d1d5db'}
                      fill={i < Math.round(selectedProduct.rating || 0) ? '#facc15' : 'none'}
                    />
                  ))}
                  <span className="ms-2 text-muted">({selectedProduct.reviews?.length || 0} reviews)</span>
                </div>
                <div className="mt-3 border-top pt-3">
                  <h6 className="fw-bold mt-4">Reviews</h6>
                  <div className="list-group">
                    {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? selectedProduct.reviews.map((review, index) => (
                      <div key={review.id || index} className="list-group-item list-group-item-action">
                        <strong>{review.user?.name || 'Anonymous'}:</strong> <q>{review.comment}</q>
                        <div>
                          {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? '#f59e0b' : '#d1d5db'} strokeWidth={0} />)}
                        </div>
                      </div>
                    )) : <p className="text-muted">No reviews yet.</p>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className={`btn ${cartItems.some((item) => item.product && item.product._id === selectedProduct._id) ? 'btn-secondary' : 'btn-success'}`}
                  disabled={cartItems.some((item) => item.product && item.product._id === selectedProduct._id)}
                  onClick={() => handleAddToCart(selectedProduct._id)}
                >
                  {cartItems.some((item) => item.product && item.product._id === selectedProduct._id) ? 'In Cart' : 'Add to Cart'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeProductModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
