import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Star, ShoppingCart, Search, MapPin, Building, CalendarCheck2, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import { config } from '../lib/config';

const PLACEHOLDER = 'https://via.placeholder.com/300x200?text=No+Image';

const Dashboard = () => {
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortOrder, setSortOrder] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    async function fetchAllProducts() {
      setLoading(true);
      try {
        const res = await axios.get(`${config.API_URL}/products`);
        if (res.data.success) {
          setAllProducts(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = allProducts
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
      .filter(p => selectedCity === 'all' || p.city === selectedCity);

    switch (sortOrder) {
      case 'price_asc':
        result.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
        break;
      case 'expiry_asc':
        result.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [allProducts, searchTerm, selectedCategory, selectedCity, sortOrder]);

  const getCities = () => {
    // Predefined list of major Indian cities for filtering
    const predefinedCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur'
    ];
    
    // Get cities from existing products
    const productCities = Array.from(new Set(allProducts.map(p => p.city).filter(city => city)));
    
    // Combine predefined cities with product cities and remove duplicates
    const allCities = [...new Set([...predefinedCities, ...productCities])];
    
    return ['all', ...allCities.sort()];
  };

  const getCategories = () => {
    return ['all', ...Array.from(new Set(allProducts.map(p => p.category)))];
  };

  const handleBuyClick = (productId, quantity = 1) => {
    // Check if user is signed in
    if (!user) {
      setNotification('Please sign in to purchase products!');
      setTimeout(() => {
        setNotification('');
        navigate('/login');
      }, 2000);
      return;
    }
    
    // Check if user has joined waitlist (has a role)
    if (!user.role) {
      setNotification('Please join the waitlist to purchase products!');
      setTimeout(() => {
        setNotification('');
        navigate('/join-waitlist');
      }, 2000);
      return;
    }
    
    // If user is signed in and has joined waitlist, add to cart
    handleAddToCart(productId, quantity);
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      await addToCart(productId, quantity);
      setNotification(`${quantity} item(s) added to cart successfully!`);
      setTimeout(() => setNotification(''), 3000);
      // Reset quantity after adding to cart
      setQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (error) {
      setNotification('Failed to add product to cart.');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleQuantityChange = (productId, change) => {
    // Check if item is in cart
    const cartItem = cartItems.find(item => item.product && item.product._id === productId);
    
    if (cartItem) {
      // If item is in cart, update cart quantity
      const newQuantity = Math.max(0, cartItem.quantity + change);
      updateQuantity(cartItem._id, newQuantity);
    } else {
      // If item is not in cart, update local quantity state
      setQuantities(prev => {
        const currentQuantity = prev[productId] || 1;
        const newQuantity = Math.max(1, currentQuantity + change);
        return { ...prev, [productId]: newQuantity };
      });
    }
  };

  const getQuantity = (productId) => {
    // Check if item is in cart first
    const cartItem = cartItems.find(item => item.product && item.product._id === productId);
    if (cartItem) {
      return cartItem.quantity;
    }
    // Otherwise return local quantity state
    return quantities[productId] || 1;
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

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
    setCarouselIndex(0);
  };

  const closeProductModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
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
        <div>
          <h1 className="fw-bold fs-2 mb-1">Dashboard</h1>
          <p className="text-muted">Browse all available products</p>
        </div>
        {user && (
          <button className="btn btn-outline-success" onClick={() => navigate('/cart')}>
            <ShoppingCart size={18} className="me-2" />
            View Cart ({cartItems.length})
          </button>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={18} />
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select 
                className="form-select" 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option key="all-categories" value="all">All Categories</option>
                {getCategories().map(category => 
                  <option key={category} value={category}>{category}</option>
                )}
              </select>
            </div>
            <div className="col-md-2">
              <select 
                className="form-select" 
                value={selectedCity} 
                onChange={e => setSelectedCity(e.target.value)}
              >
                <option key="all-cities" value="all">All Cities</option>
                {getCities().map(city => 
                  <option key={city} value={city}>{city}</option>
                )}
              </select>
            </div>
            <div className="col-md-2">
              <select 
                className="form-select" 
                value={sortOrder} 
                onChange={e => setSortOrder(e.target.value)}
              >
                <option key="sort-name" value="name">Sort by Name</option>
                <option key="sort-price-asc" value="price_asc">Price (Low to High)</option>
                <option key="sort-price-desc" value="price_desc">Price (High to Low)</option>
                <option key="sort-expiry-asc" value="expiry_asc">Expiry (Soonest)</option>
              </select>
            </div>
            <div className="col-md-2">
              <span className="text-muted fw-semibold d-flex align-items-center h-100">
                {filteredAndSortedProducts.length} products found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="col-12 text-center py-5">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
              <span className="display-6">🔍</span>
            </div>
            <h6 className="text-muted">No Products Found</h6>
            <p className="text-muted small">Try adjusting your search criteria.</p>
          </div>
        ) : (
          filteredAndSortedProducts.map((product) => (
            <div className="col" key={product._id}>
              <div className="card h-100 shadow-sm product-card">
                <div className="position-relative">
                  <img
                    src={product.images?.[0] || product.imageUrl || PLACEHOLDER}
                    alt={product.name}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  {calculateDiscountPercent(product.price, product.discountedPrice) > 0 && (
                    <span className="badge bg-success position-absolute top-0 end-0 m-2 fs-6">
                      {calculateDiscountPercent(product.price, product.discountedPrice)}% OFF
                    </span>
                  )}
                  <span className={`badge position-absolute top-0 start-0 m-2 fs-6 ${
                    product.category === 'medicines' ? 'bg-primary' : 'bg-success'
                  }`}>
                    {product.category}
                  </span>
                </div>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold mb-2">{product.name}</h5>
                  
                  {/* Vendor Information */}
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span className="d-flex align-items-center gap-1">
                      <Building size={14} /> 
                      {product.vendor?.name || 'Verified Vendor'}
                    </span>
                    <div className="d-flex align-items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < (product.rating || 0) ? '#f59e0b' : '#d1d5db'} 
                          strokeWidth={0}
                        />
                      ))}
                      <span className="ms-1">({product.reviews?.length || 0})</span>
                    </div>
                  </div>
                  
                  {/* Location and Expiry */}
                  <p className="text-muted small d-flex align-items-center gap-1 mb-2">
                    <MapPin size={14} /> {product.city || 'N/A'}
                  </p>
                  <p className={`fw-semibold d-flex align-items-center gap-1 mb-3 small ${
                    calculateDaysLeft(product.expiryDate) <= 7 ? 'text-danger' : 'text-success'
                  }`}>
                    <CalendarCheck2 size={14} /> 
                    Expires in {calculateDaysLeft(product.expiryDate)} days
                  </p>
                  
                  {/* Price */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-4 fw-bold text-success">
                        ${(product.discountedPrice || product.price).toFixed(2)}
                      </span>
                      {product.discountedPrice && (
                        <span className="text-muted text-decoration-line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {getQuantity(product._id) > 1 && (
                      <div className="mt-1">
                        <small className="text-muted">
                          Total for {getQuantity(product._id)}: 
                          <span className="fw-bold text-success ms-1">
                            ${((product.discountedPrice || product.price) * getQuantity(product._id)).toFixed(2)}
                          </span>
                        </small>
                      </div>
                    )}
                  </div>

                  <p className="card-text small flex-grow-1">{product.description}</p>
                  
                  {/* Action Buttons */}
                  <div className="mt-auto d-grid gap-2">
                    {/* Quantity Selector */}
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleQuantityChange(product._id, -1)}
                        style={{ width: '32px', height: '32px', padding: 0 }}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="fw-bold" style={{ minWidth: '30px', textAlign: 'center' }}>
                        {getQuantity(product._id)}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleQuantityChange(product._id, 1)}
                        style={{ width: '32px', height: '32px', padding: 0 }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      className={`btn ${
                        cartItems.some((item) => item.product && item.product._id === product._id) 
                          ? 'btn-secondary' 
                          : 'btn-success'
                      }`}
                      disabled={cartItems.some((item) => item.product && item.product._id === product._id)}
                      onClick={() => handleBuyClick(product._id, getQuantity(product._id))}
                    >
                      {cartItems.some((item) => item.product && item.product._id === product._id) 
                        ? 'In Cart' 
                        : `Add ${getQuantity(product._id)} to Cart`
                      }
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => openProductModal(product)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && modalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{selectedProduct.name}</h5>
                <button type="button" className="btn-close" onClick={closeProductModal}></button>
              </div>
              <div className="modal-body">
                {/* Image Carousel */}
                <div className="mb-3 text-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <div className="position-relative">
                      <img
                        src={selectedProduct.images[carouselIndex]}
                        alt={selectedProduct.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '300px', objectFit: 'cover' }}
                      />
                      {selectedProduct.images.length > 1 && (
                        <>
                          <button
                            className="btn btn-light position-absolute top-50 start-0 translate-middle-y"
                            onClick={() => setCarouselIndex((prev) => 
                              prev === 0 ? selectedProduct.images.length - 1 : prev - 1
                            )}
                          >
                            ‹
                          </button>
                          <button
                            className="btn btn-light position-absolute top-50 end-0 translate-middle-y"
                            onClick={() => setCarouselIndex((prev) => 
                              prev === selectedProduct.images.length - 1 ? 0 : prev + 1
                            )}
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <img
                      src={selectedProduct.imageUrl || PLACEHOLDER}
                      alt={selectedProduct.name}
                      className="img-fluid rounded"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                    />
                  )}
                </div>
                
                {/* Product Details */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <span className="fw-semibold">Category:</span> {selectedProduct.category}
                    </div>
                    <div className="mb-2">
                      <span className="fw-semibold">Vendor:</span> {selectedProduct.vendor?.name || 'Verified Vendor'}
                    </div>
                    <div className="mb-2">
                      <span className="fw-semibold">Location:</span> {selectedProduct.city}
                    </div>
                    <div className="mb-2">
                      <span className="fw-semibold">Expiry:</span> {selectedProduct.expiryDate ? new Date(selectedProduct.expiryDate).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-2">
                      <span className="fw-semibold">Price:</span> ${selectedProduct.price?.toFixed(2)}
                    </div>
                    {selectedProduct.discountedPrice && (
                      <div className="mb-2">
                        <span className="fw-semibold">Discounted Price:</span> ${selectedProduct.discountedPrice.toFixed(2)}
                      </div>
                    )}
                    {getQuantity(selectedProduct._id) > 1 && (
                      <div className="mb-2">
                        <span className="fw-semibold">Total for {getQuantity(selectedProduct._id)}:</span> 
                        <span className="fw-bold text-success ms-1">
                          ${((selectedProduct.discountedPrice || selectedProduct.price) * getQuantity(selectedProduct._id)).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="mb-2">
                      <span className="fw-semibold">Available Stock:</span> {selectedProduct.stock || 0}
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <span className="fw-semibold me-2">Rating:</span>
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
                  </div>
                </div>
                
                <div className="mb-3">
                  <span className="fw-semibold">Description:</span> {selectedProduct.description}
                </div>
                
                {/* Reviews Section */}
                <div className="mt-4 border-top pt-3">
                  <h6 className="fw-bold mb-3">Customer Reviews</h6>
                  <div className="list-group">
                    {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? 
                      selectedProduct.reviews.map((review) => (
                        <div key={review.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <strong>{review.user?.name || 'Anonymous'}</strong>
                            <div className="d-flex">
                              {[...Array(5)].map((_, i) => 
                                <Star key={i} size={14} fill={i < review.rating ? '#f59e0b' : '#d1d5db'} strokeWidth={0}/>
                              )}
                            </div>
                          </div>
                          <p className="mb-0 mt-1"><q>{review.comment}</q></p>
                        </div>
                      )) 
                      : <p className="text-muted">No reviews yet.</p>
                    }
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex align-items-center gap-3">
                  {/* Quantity Selector in Modal */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 fw-semibold">Quantity:</label>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleQuantityChange(selectedProduct._id, -1)}
                      style={{ width: '32px', height: '32px', padding: 0 }}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="fw-bold" style={{ minWidth: '30px', textAlign: 'center' }}>
                      {getQuantity(selectedProduct._id)}
                    </span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleQuantityChange(selectedProduct._id, 1)}
                      style={{ width: '32px', height: '32px', padding: 0 }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    className={`btn ${
                      cartItems.some((item) => item.product && item.product._id === selectedProduct._id) 
                        ? 'btn-secondary' 
                        : 'btn-success'
                    }`}
                    disabled={cartItems.some((item) => item.product && item.product._id === selectedProduct._id)}
                    onClick={() => handleBuyClick(selectedProduct._id, getQuantity(selectedProduct._id))}
                  >
                    {cartItems.some((item) => item.product && item.product._id === selectedProduct._id) 
                      ? 'In Cart' 
                      : `Add ${getQuantity(selectedProduct._id)} to Cart`
                    }
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeProductModal}>
                    Close
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
