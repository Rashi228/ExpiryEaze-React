import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { config } from '../lib/config';
import { Star, Heart, CalendarCheck2, MapPin, Building, Search, ArrowLeft, Eye, Filter, Trash2 } from 'lucide-react';
import VendorProfileSidebar from '../components/VendorProfileSidebar';

const PLACEHOLDER = 'https://via.placeholder.com/300x200.png?text=No+Image';

const MedicinesDashboard = () => {
    const navigate = useNavigate();
    const { cartItems, addToCart } = useCart();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [wishlist, setWishlist] = useState([]);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [selectedCity, setSelectedCity] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedPrescription, setSelectedPrescription] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [notification, setNotification] = useState('');

    const [prescriptionModal, setPrescriptionModal] = useState({ isOpen: false, medicineId: '', file: null });

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalViews: 0 });

    useEffect(() => {
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
        fetchMedicines();
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchProducts();
    }, []);

    const fetchProfile = async () => {
        setProfileLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/vendors/profile`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setProfile(res.data.profile);
        } catch (err) {
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/products/vendor`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            // Filter to show only medicines from this vendor
            const vendorMedicines = (res.data.products || []).filter(product => product.category === 'medicines');
            setProducts(vendorMedicines);
            // Update stats from products list for now (server-side aggregation can replace this later)
            const totalProducts = vendorMedicines.length;
            setStats(prev => ({ ...prev, totalProducts }));
        } catch (err) {
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    // TODO: Replace with real orders/analytics endpoints when available
    useEffect(() => {
        const token = localStorage.getItem('token');
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${config.API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
                const orders = res.data?.data || res.data?.orders || [];
                // Compute orders/revenue for this vendor's products only
                const productIds = new Set(products.map(p => p._id));
                let totalOrders = 0;
                let totalRevenue = 0;
                orders.forEach(o => {
                    (o.products || []).forEach(op => {
                        if (productIds.has(op.product?._id || op.product)) {
                            totalOrders += 1;
                            totalRevenue += (op.price || 0) * (op.quantity || 0);
                        }
                    });
                });
                setStats(prev => ({ ...prev, totalOrders, totalRevenue }));
            } catch (e) {
                // Keep defaults on error
            }
        };
        if (products.length) fetchOrders();
    }, [products]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification('');
        }, 3000);
    }

    const filteredAndSortedMedicines = useMemo(() => {
        let result = medicines
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(p => selectedCity === 'all' || p.city === selectedCity)
            .filter(p => selectedCategory === 'all' || p.subCategory === selectedCategory) // You might need a subCategory field in your model
            .filter(p => {
                if (selectedPrescription === 'all') return true;
                return selectedPrescription === 'required' ? p.prescriptionRequired : !p.prescriptionRequired;
            });

        switch (sortBy) {
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
    }, [medicines, searchTerm, selectedCity, selectedCategory, selectedPrescription, sortBy]);


    const handleAddToCart = async (medicine) => {
        if (medicine.prescriptionRequired) {
            setPrescriptionModal({ isOpen: true, medicineId: medicine._id, file: null });
            return;
        }
        try {
            await addToCart(medicine._id, 1);
            showNotification('Medicine added to cart!');
        } catch (error) {
            showNotification(error.message || 'Failed to add medicine to cart.');
        }
    };

    const handlePrescriptionSubmit = async () => {
        // In a real app, you'd handle the prescription file upload to a server here
        if (prescriptionModal.file) {
            console.log('Uploading prescription:', prescriptionModal.file.name);
            try {
                await addToCart(prescriptionModal.medicineId, 1);
                setPrescriptionModal({ isOpen: false, medicineId: '', file: null });
                showNotification('Medicine added to cart!');
            } catch (error) {
                showNotification(error.message || 'Failed to add medicine to cart.');
            }
        } else {
            alert('Please upload a prescription file.');
        }
    };
    
    const getCities = () => ['all', ...Array.from(new Set(medicines.map(p => p.city)))];
    const getCategories = () => ['all', ...Array.from(new Set(medicines.map(p => p.subCategory)))]; // Assumes subCategory

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

    const handleAddProductClick = () => {
        if (profileLoading) return;
        if (!profile || !profile.profileCompleted) {
            setShowProfileModal(true);
            return;
        }
        navigate('/add-product');
    };

    const handleProfileUpdated = () => {
        fetchProfile();
        fetchProducts();
    };

    if (loading) return <div className="p-5 text-center"><h3>Loading Medicines...</h3></div>;
    if (error) return <div className="p-5 text-center text-danger"><h3>{error}</h3></div>;

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
            <VendorProfileSidebar 
                isOpen={sidebarOpen} 
                onOpenChange={setSidebarOpen} 
                onProfileUpdated={handleProfileUpdated}
            />

            {/* Main Content */}
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h2 mb-0 text-success">
                                <i className="fas fa-pills me-2"></i>
                                Medicine Vendor Dashboard
                            </h1>
                            <p className="text-muted mb-0">Manage your medicine products and profile</p>
                        </div>
                        <button
                            className="btn btn-success btn-lg"
                            onClick={handleAddProductClick}
                            disabled={profileLoading}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Add Medicine Product
                        </button>
                    </div>

                    {/* Profile Completion Alert */}
                    {!profileLoading && (!profile || !profile.profileCompleted) && (
                        <div className="alert alert-warning mb-4">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <strong>Profile Incomplete:</strong> Please complete your vendor profile to add medicine products.
                            <button 
                                className="btn btn-sm btn-warning ms-3"
                                onClick={() => setSidebarOpen(true)}
                            >
                                Complete Profile
                            </button>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="row mb-4">
                        <div className="col-md-3 mb-3">
                            <div className="card border-success h-100">
                                <div className="card-body text-center">
                                    <div className="text-success mb-2">
                                        <i className="fas fa-pills" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <h3 className="card-title mb-1">{products.length}</h3>
                                    <p className="card-text text-muted">Total Products</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card border-info h-100">
                                <div className="card-body text-center">
                                    <div className="text-info mb-2">
                                        <i className="fas fa-eye" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <h3 className="card-title mb-1">{stats.totalViews}</h3>
                                    <p className="card-text text-muted">Total Views</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card border-warning h-100">
                                <div className="card-body text-center">
                                    <div className="text-warning mb-2">
                                        <i className="fas fa-shopping-cart" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <h3 className="card-title mb-1">{stats.totalOrders}</h3>
                                    <p className="card-text text-muted">Total Orders</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card border-primary h-100">
                                <div className="card-body text-center">
                                    <div className="text-primary mb-2">
                                        <i className="fas fa-dollar-sign" style={{ fontSize: '2rem' }}></i>
                                    </div>
                                    <h3 className="card-title mb-1">₹{stats.totalRevenue.toFixed(0)}</h3>
                                    <p className="card-text text-muted">Total Revenue</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="card">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-list me-2"></i>
                                Your Medicine Products
                            </h5>
                        </div>
                        <div className="card-body">
                            {productsLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Loading your products...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="text-muted mb-3">
                                        <i className="fas fa-pills" style={{ fontSize: '4rem' }}></i>
                                    </div>
                                    <h5 className="text-muted">No Medicine Products Yet</h5>
                                    <p className="text-muted mb-4">Start by adding your first medicine product to your inventory.</p>
                                    <button
                                        className="btn btn-success"
                                        onClick={handleAddProductClick}
                                        disabled={profileLoading}
                                    >
                                        <i className="fas fa-plus me-2"></i>
                                        Add Your First Product
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Stock</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product._id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img 
                                                                src={product.image || '/placeholder.jpg'} 
                                                                alt={product.name}
                                                                className="rounded me-3"
                                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                            />
                                                            <div>
                                                                <h6 className="mb-0">{product.name}</h6>
                                                                <small className="text-muted">{product.description}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-success">{product.category}</span>
                                                    </td>
                                                    <td>₹{product.price}</td>
                                                    {/* Correct stock field from product.stockQuantity -> product.stock */}
                                                    <td>{product.stock}</td>
                                                    {/* Derive status: Active when in stock and not expired */}
                                                    <td>
                                                        <span className={`badge ${((product?.stock || 0) > 0 && (product?.expiryDate ? (new Date(product.expiryDate) > new Date()) : true)) ? 'bg-success' : 'bg-secondary'}`}>
                                                            {((product?.stock || 0) > 0 && (product?.expiryDate ? (new Date(product.expiryDate) > new Date()) : true)) ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-primary me-2">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Completion Modal */}
            {showProfileModal && (
                <div className="modal show fade d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">Complete Your Profile</h5>
                                <button type="button" className="btn-close" onClick={() => setShowProfileModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>You need to complete your vendor profile before you can add medicine products.</p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>
                                    Cancel
                                </button>
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
        </div>
    );
};

export default MedicinesDashboard;
