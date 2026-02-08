import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { config } from '../lib/config';
import { Star, Heart, CalendarCheck2, MapPin, Building, Search, Filter, ShoppingCart } from 'lucide-react';

const PLACEHOLDER = 'https://via.placeholder.com/300x200.png?text=No+Image';

const UserMedicinesDashboard = () => {
    const navigate = useNavigate();
    const { cartItems, addToCart, updateQuantity } = useCart();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('name');
    const [notification, setNotification] = useState('');
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [vendorsLoading, setVendorsLoading] = useState(false);
    // Local quantities for products not yet in cart
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        fetchMedicines();
        fetchVendors();
    }, []);

    const fetchMedicines = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${config.API_URL}/products`);
            if (res.data.success) {
                const fetchedMedicines = res.data.data.filter((p) => p.category === 'medicines');
                setMedicines(fetchedMedicines);
            } else {
                setError('Failed to fetch medicines.');
            }
        } catch (err) {
            setError('An error occurred while fetching medicines.');
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        setVendorsLoading(true);
        try {
            const res = await axios.get(`${config.API_URL}/vendors/all-with-products`);
            if (res.data.success) {
                // Filter vendors who have medicines
                const medicineVendors = res.data.data.filter(vendorData => 
                    vendorData.products.some(product => product.category === 'medicines')
                );
                setVendors(medicineVendors);
            }
        } catch (err) {
            console.error('Error fetching vendors:', err);
        } finally {
            setVendorsLoading(false);
        }
    };

    const filteredAndSortedMedicines = useMemo(() => {
        let result = medicines
            .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(m => selectedCity === 'all' || m.city === selectedCity)
            .filter(m => selectedCategory === 'all' || m.subcategory === selectedCategory);

        switch (sortOrder) {
            case 'price_asc':
                result.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
                break;
            case 'price_desc':
                result.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
                break;
            case 'expiry_asc':
                result.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                break;
            default: // name
                result.sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }, [medicines, searchTerm, selectedCity, selectedCategory, sortOrder]);

    const getCities = () => {
        return ['all', ...Array.from(new Set(medicines.map(m => m.city)))];
    };

    const getCategories = () => {
        return ['all', ...Array.from(new Set(medicines.map(m => m.subcategory)))];
    };

    const toggleWishlist = (medicineId) => {
        if (wishlist.includes(medicineId)) {
            setWishlist(wishlist.filter((id) => id !== medicineId));
        } else {
            setWishlist([...wishlist, medicineId]);
        }
    };

    const openMedicineModal = (medicine) => {
        setSelectedMedicine(medicine);
        setCarouselIndex(0);
        setModalOpen(true);
    };

    const closeMedicineModal = () => {
        setModalOpen(false);
        setSelectedMedicine(null);
    };

    const handleAddToCart = async (medicineId, quantity = 1) => {
        try {
            await addToCart(medicineId, quantity);
            setNotification('Medicine added to cart successfully!');
            setTimeout(() => setNotification(''), 3000);
            setQuantities(prev => ({ ...prev, [medicineId]: 1 }));
        } catch (error) {
            setNotification('Failed to add medicine to cart.');
            setTimeout(() => setNotification(''), 3000);
        }
    };

    // Quantity helpers
    const getQuantity = (productId) => {
        const cartItem = cartItems.find(ci => ci.product && ci.product._id === productId);
        if (cartItem) return cartItem.quantity;
        return quantities[productId] || 1;
    };

    const handleQuantityChange = (productId, change) => {
        const cartItem = cartItems.find(ci => ci.product && ci.product._id === productId);
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

    if (loading) return <div className="p-5 text-center">Loading medicines...</div>;
    if (error) return <div className="p-5 text-center text-danger">{error}</div>;

    return (
        <div className="container py-5">
            {notification && (
                <div className="alert alert-success position-fixed top-0 end-0 m-3" style={{ zIndex: 1060 }}>
                    {notification}
                </div>
            )}
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold fs-2 mb-1">Medicine Marketplace</h1>
                    <p className="text-muted">Browse and purchase medicines from verified vendors with complete vendor profiles</p>
                </div>
                <button className="btn btn-outline-success" onClick={() => navigate('/cart')}>
                    <ShoppingCart size={18} className="me-2" />
                    View Cart ({cartItems.length})
                </button>
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
                                    placeholder="Search medicines..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <select 
                                className="form-select" 
                                value={selectedCity} 
                                onChange={e => setSelectedCity(e.target.value)}
                            >
                                <option value="all">All Cities</option>
                                {getCities().map(city => 
                                    <option key={city} value={city}>{city}</option>
                                )}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <select 
                                className="form-select" 
                                value={selectedCategory} 
                                onChange={e => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {getCategories().map(category => 
                                    <option key={category} value={category}>{category}</option>
                                )}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <select 
                                className="form-select" 
                                value={sortOrder} 
                                onChange={e => setSortOrder(e.target.value)}
                            >
                                <option value="name">Sort by Name</option>
                                <option value="price_asc">Price (Low to High)</option>
                                <option value="price_desc">Price (High to Low)</option>
                                <option value="expiry_asc">Expiry (Soonest)</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <span className="text-muted fw-semibold d-flex align-items-center h-100">
                                {filteredAndSortedMedicines.length} medicines found
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor Profiles Section */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Available Medicine Vendors</h5>
                    {vendors.length > 0 && (
                        <button
                            className={`btn ${showAllProducts && !selectedVendor ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => {
                                setSelectedVendor(null);
                                setShowAllProducts(true);
                            }}
                        >
                            Browse All Vendor Products
                        </button>
                    )}
                </div>
                {vendorsLoading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Loading vendors...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading vendor profiles...</p>
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="text-center py-4">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
                            <Building size={40} className="text-muted" />
                        </div>
                        <h6 className="text-muted">No Medicine Vendors Available</h6>
                        <p className="text-muted small">Check back later for medicine vendors in your area.</p>
                    </div>
                ) : (
                    <div className="row g-3 mb-4">
                        {vendors.map(({ vendor, products }) => (
                        <div key={vendor._id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                                            <Building size={24} className="text-success" />
                                        </div>
                                        <div>
                                            <h6 className="mb-1 fw-bold">{vendor.name}</h6>
                                            <small className="text-muted">{vendor.email}</small>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <span className="badge bg-success me-2">{products.filter(p => p.category === 'medicines').length} Medicines</span>
                                        <span className="badge bg-info">{vendor.location || vendor.city || 'Location N/A'}</span>
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button
                                            className={`btn btn-sm ${selectedVendor && selectedVendor._id === vendor._id ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => {
                                                // Toggle: if same vendor is selected, deselect it (hide products)
                                                // Otherwise, select this vendor (show their products)
                                                if (selectedVendor && selectedVendor._id === vendor._id) {
                                                    setSelectedVendor(null);
                                                    setShowAllProducts(false); // Hide products when deselecting
                                                } else {
                                                    setSelectedVendor(vendor);
                                                    setShowAllProducts(false); // Don't show all when selecting specific vendor
                                                }
                                            }}
                                        >
                                            {selectedVendor && selectedVendor._id === vendor._id 
                                                ? `Hide ${vendor.name}'s Medicines` 
                                                : `View ${vendor.name}'s Medicines`
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                )}
                
                {/* Removed chip list to declutter; use the single "Browse All Vendor Products" button above */}
            </div>

            {/* Medicines Grid */}
            {(() => {
                // Only show medicines if a vendor is selected OR showAllProducts is true
                if (!selectedVendor && !showAllProducts) {
                    return null; // Hide products section when nothing is selected
                }
                
                const visibleMedicines = filteredAndSortedMedicines.filter(medicine => {
                    if (showAllProducts && !selectedVendor) return true; // Show all when "Browse All" is clicked
                    if (!selectedVendor) return false; // Hide if no vendor selected and not showing all
                    const productVendorId = (medicine.vendor && typeof medicine.vendor === 'object') ? medicine.vendor._id : medicine.vendor;
                    return productVendorId === selectedVendor._id;
                });
                
                if (selectedVendor && visibleMedicines.length === 0) {
                    return (
                        <div className="alert alert-warning" role="alert">
                            No products added by {selectedVendor.name} yet. Please recheck later.
                        </div>
                    );
                }
                return (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {visibleMedicines.map((medicine) => (
                    <div className="col" key={medicine._id}>
                        <div className="card h-100 shadow-sm medicine-card">
                            <div className="position-relative">
                                <img
                                    src={medicine.images?.[0] || medicine.imageUrl || PLACEHOLDER}
                                    alt={medicine.name}
                                    className="card-img-top"
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                                {calculateDiscountPercent(medicine.price, medicine.discountedPrice) > 0 && (
                                    <span className="badge bg-success position-absolute top-0 end-0 m-2 fs-6">
                                        {calculateDiscountPercent(medicine.price, medicine.discountedPrice)}% OFF
                                    </span>
                                )}
                                <button
                                    className="btn btn-sm btn-light position-absolute top-0 start-0 m-2"
                                    onClick={() => toggleWishlist(medicine._id)}
                                >
                                    <Heart 
                                        size={16} 
                                        fill={wishlist.includes(medicine._id) ? '#dc3545' : 'none'}
                                        color={wishlist.includes(medicine._id) ? '#dc3545' : '#6c757d'}
                                    />
                                </button>
                            </div>
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title fw-bold mb-2">{medicine.name}</h5>
                                
                                {/* Vendor Information */}
                                <div className="d-flex justify-content-between text-muted small mb-2">
                                    <span className="d-flex align-items-center gap-1">
                                        <Building size={14} /> 
                                        { (medicine?.vendor && typeof medicine.vendor === 'object' && medicine.vendor?.name)
                                            ? `Verified Vendor · ${medicine.vendor.name}`
                                            : (medicine?.vendorName
                                                ? `Verified Vendor · ${medicine.vendorName}`
                                                : 'Verified Vendor') }
                                    </span>
                                    <div className="d-flex align-items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                fill={i < (medicine.rating || 0) ? '#f59e0b' : '#d1d5db'} 
                                                strokeWidth={0}
                                            />
                                        ))}
                                        <span className="ms-1">({medicine.reviews?.length || 0})</span>
                                    </div>
                                </div>
                                
                                {/* Location and Expiry */}
                                <p className="text-muted small d-flex align-items-center gap-1 mb-2">
                                    <MapPin size={14} /> {medicine.city || 'N/A'}
                                </p>
                                <p className={`fw-semibold d-flex align-items-center gap-1 mb-3 small ${
                                    calculateDaysLeft(medicine.expiryDate) <= 7 ? 'text-danger' : 'text-success'
                                }`}>
                                    <CalendarCheck2 size={14} /> 
                                    Expires in {calculateDaysLeft(medicine.expiryDate)} days
                                </p>
                                
                                {/* Price */}
                                <div className="mb-3">
                                    <span className="fs-4 fw-bold text-success">
                                        ₹{(medicine.discountedPrice || medicine.price).toFixed(2)}
                                    </span>
                                    {medicine.discountedPrice && (
                                        <span className="ms-2 text-muted text-decoration-line-through">
                                            ₹{medicine.price.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                <p className="card-text small flex-grow-1">{medicine.description}</p>
                                
                                {/* Quantity + Actions */}
                                <div className="mt-auto d-grid gap-2">
                                    <div className="d-flex justify-content-center align-items-center gap-2">
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => handleQuantityChange(medicine._id, -1)}
                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                        >
                                            -
                                        </button>
                                        <span className="fw-bold" style={{ minWidth: '30px', textAlign: 'center' }}>
                                            {getQuantity(medicine._id)}
                                        </span>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => handleQuantityChange(medicine._id, 1)}
                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        className={`btn ${
                                            cartItems.some((item) => item.product && item.product._id === medicine._id) 
                                                ? 'btn-secondary' 
                                                : 'btn-success'
                                        }`}
                                        disabled={cartItems.some((item) => item.product && item.product._id === medicine._id)}
                                        onClick={() => handleAddToCart(medicine._id, getQuantity(medicine._id))}
                                    >
                                        {cartItems.some((item) => item.product && item.product._id === medicine._id) 
                                            ? 'In Cart' 
                                            : `Add ${getQuantity(medicine._id)} to Cart`
                                        }
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => openMedicineModal(medicine)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                        ))}
                    </div>
                );
            })()}

            {/* Medicine Details Modal */}
            {selectedMedicine && modalOpen && (
                <div className="modal show fade d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedMedicine.name}</h5>
                                <button type="button" className="btn-close" onClick={closeMedicineModal}></button>
                            </div>
                            <div className="modal-body">
                                {/* Image Carousel */}
                                <div className="mb-3 text-center">
                                    {selectedMedicine.images && selectedMedicine.images.length > 0 ? (
                                        <>
                                            <img
                                                src={selectedMedicine.images[carouselIndex]}
                                                alt={selectedMedicine.name}
                                                className="img-fluid rounded mb-2"
                                                style={{ maxHeight: 300 }}
                                            />
                                            {selectedMedicine.images.length > 1 && (
                                                <div className="d-flex justify-content-center gap-2 mt-2">
                                                    {selectedMedicine.images.map((img, idx) => (
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
                                            src={selectedMedicine.imageUrl || PLACEHOLDER}
                                            alt={selectedMedicine.name}
                                            className="img-fluid rounded mb-2"
                                            style={{ maxHeight: 300 }}
                                        />
                                    )}
                                </div>
                                
                                {/* Medicine Details */}
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <span className="fw-semibold">Vendor:</span> { (selectedMedicine?.vendor && typeof selectedMedicine.vendor === 'object' && selectedMedicine.vendor?.name)
                                                ? `${selectedMedicine.vendor.name} (Verified Vendor)`
                                                : (selectedMedicine?.vendorName
                                                    ? `${selectedMedicine.vendorName} (Verified Vendor)`
                                                    : 'Verified Vendor') }
                                        </div>
                                        <div className="mb-2">
                                            <span className="fw-semibold">Location:</span> {selectedMedicine.city}
                                        </div>
                                        <div className="mb-2">
                                            <span className="fw-semibold">Category:</span> {selectedMedicine.subcategory || 'Medicine'}
                                        </div>
                                        <div className="mb-2">
                                            <span className="fw-semibold">Expiry:</span> {selectedMedicine.expiryDate ? new Date(selectedMedicine.expiryDate).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <span className="fw-semibold">Price:</span> ₹{selectedMedicine.price?.toFixed(2)}
                                        </div>
                                        {selectedMedicine.discountedPrice && (
                                            <div className="mb-2">
                                                <span className="fw-semibold">Discounted Price:</span> ₹{selectedMedicine.discountedPrice.toFixed(2)}
                                            </div>
                                        )}
                                        <div className="mb-2">
                                            <span className="fw-semibold">Available Stock:</span> {selectedMedicine.stock || 0}
                                        </div>
                                        <div className="mb-2 d-flex align-items-center">
                                            <span className="fw-semibold me-2">Rating:</span>
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    color={i < Math.round(selectedMedicine.rating || 0) ? '#facc15' : '#d1d5db'}
                                                    fill={i < Math.round(selectedMedicine.rating || 0) ? '#facc15' : 'none'}
                                                />
                                            ))}
                                            <span className="ms-2 text-muted">({selectedMedicine.reviews?.length || 0} reviews)</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mb-3">
                                    <span className="fw-semibold">Description:</span> {selectedMedicine.description}
                                </div>
                                
                                {/* Reviews Section */}
                                <div className="mt-4 border-top pt-3">
                                    <h6 className="fw-bold mb-3">Customer Reviews</h6>
                                    <div className="list-group">
                                        {selectedMedicine.reviews && selectedMedicine.reviews.length > 0 ? 
                                            selectedMedicine.reviews.map((review) => (
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
                                <button
                                    className={`btn ${
                                        cartItems.some((item) => item.product && item.product._id === selectedMedicine._id) 
                                            ? 'btn-secondary' 
                                            : 'btn-success'
                                    }`}
                                    disabled={cartItems.some((item) => item.product && item.product._id === selectedMedicine._id)}
                                    onClick={() => handleAddToCart(selectedMedicine._id)}
                                >
                                    {cartItems.some((item) => item.product && item.product._id === selectedMedicine._id) 
                                        ? 'In Cart' 
                                        : 'Add to Cart'
                                    }
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={closeMedicineModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMedicinesDashboard;
