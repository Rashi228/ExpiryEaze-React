import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { config } from '../lib/config';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

// NOTE: Make sure to add a route for this page in your router (e.g., <Route path="/add-product" element={<AddProduct />} />)

const AddProduct = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    stock: '',
    expiryDate: '',
    category: '',
    requiresPrescription: false,
  });
  
  const [images, setImages] = useState([]);
  const [expiryPhoto, setExpiryPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendorSection, setVendorSection] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Determine vendor section and available categories
  useEffect(() => {
    const storedVendorCategory = localStorage.getItem('vendorCategory');
    setVendorSection(storedVendorCategory);
    
    if (storedVendorCategory === 'groceries') {
      setAvailableCategories([
        { value: 'groceries', label: 'Groceries' },
        { value: 'dairy', label: 'Dairy' },
        { value: 'bakery', label: 'Bakery' },
        { value: 'beverages', label: 'Beverages' },
        { value: 'snacks', label: 'Snacks' },
        { value: 'fruits', label: 'Fruits' },
        { value: 'vegetables', label: 'Vegetables' },
        { value: 'meat', label: 'Meat & Poultry' },
        { value: 'seafood', label: 'Seafood' },
        { value: 'frozen', label: 'Frozen Foods' },
        { value: 'canned', label: 'Canned Foods' },
        { value: 'condiments', label: 'Condiments & Spices' }
      ]);
      setProduct(prev => ({ ...prev, category: 'groceries' }));
    } else if (storedVendorCategory === 'medicines') {
      setAvailableCategories([
        { value: 'medicines', label: 'Medicines' },
        { value: 'prescription', label: 'Prescription Drugs' },
        { value: 'otc', label: 'Over-the-Counter' },
        { value: 'supplements', label: 'Supplements' },
        { value: 'medical-devices', label: 'Medical Devices' },
        { value: 'personal-care', label: 'Personal Care' },
        { value: 'baby-care', label: 'Baby Care' },
        { value: 'first-aid', label: 'First Aid' }
      ]);
      setProduct(prev => ({ ...prev, category: 'medicines' }));
    } else {
      // Fallback: if no vendor category is stored, redirect to category selection
      console.warn('No vendor category found in localStorage. Redirecting to category selection.');
      navigate('/vendor-category-selection');
    }
  }, [navigate]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${config.API_URL}/products/${id}`);
          const existingProduct = res.data.data;
          if (existingProduct) {
            setProduct({
              name: existingProduct.name,
              description: existingProduct.description,
              price: existingProduct.price.toString(),
              discountedPrice: existingProduct.discountedPrice?.toString() || '',
              stock: existingProduct.stock.toString(),
              expiryDate: new Date(existingProduct.expiryDate).toISOString().split('T')[0],
              category: existingProduct.category || 'groceries',
              requiresPrescription: existingProduct.requiresPrescription || false,
            });
            if (existingProduct.images && existingProduct.images.length > 0) {
              setImages(existingProduct.images.map((imgUrl, index) => ({ id: `existing-${index}`, url: imgUrl, type: 'product', alt: 'product image' })));
            }
            if (existingProduct.expiryPhoto) {
              setExpiryPhoto(existingProduct.expiryPhoto);
            }
          }
        } catch (err) {
          setError('Failed to fetch product details.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!user) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    // Basic client-side validation to avoid NaN/empty submits
    const priceNum = parseFloat(product.price);
    const stockNum = parseInt(product.stock, 10);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price.');
      setLoading(false);
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError('Please enter a valid stock quantity.');
      setLoading(false);
      return;
    }

    const productData = {
      ...product,
      vendor: user.id,
      vendorName: user.name,
      price: priceNum,
      stock: stockNum,
      discountedPrice: product.discountedPrice ? parseFloat(product.discountedPrice) : undefined,
      images: images.map(img => img.url),
      expiryPhoto: expiryPhoto,
      requiresPrescription: (product.category === 'medicines' || product.category === 'prescription') ? product.requiresPrescription : false,
    };

    try {
      if (isEditMode) {
        await axios.put(`${config.API_URL}/products/${id}`, productData);
      } else {
        await axios.post(`${config.API_URL}/products`, productData);
      }
      
      // Navigate to correct dashboard based on vendor section
      const vendorSection = localStorage.getItem('vendorCategory');
      if (vendorSection === 'medicines') {
        navigate('/medicines-dashboard');
      } else {
        navigate('/vendor-dashboard');
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.error;
      setError(serverMsg || 'Failed to save product. Please check your inputs.');
      console.error('Save product error:', err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="text-center fw-bold mb-4">{isEditMode ? 'Edit Product' : 'Add a New Product'}</h1>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Product Name</label>
                  <input type="text" className="form-control" id="name" name="name" value={product.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea className="form-control" id="description" name="description" rows={3} value={product.description} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">
                    Category {vendorSection && (
                      <span className="text-muted small">
                        ({vendorSection === 'groceries' ? 'Groceries Section' : 'Medicines Section'})
                      </span>
                    )}
                  </label>
                  <select 
                    className="form-select" 
                    id="category" 
                    name="category" 
                    value={product.category} 
                    onChange={handleChange}
                    required
                  >
                    {availableCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prescription Requirement for Medicines */}
                {(product.category === 'medicines' || product.category === 'prescription') && (
                  <div className="mb-3">
                    <div className="card border-warning">
                      <div className="card-body">
                        <h6 className="card-title text-warning mb-3">
                          <i className="fas fa-prescription-bottle-alt me-2"></i>
                          Medicine Prescription Requirement
                        </h6>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="requiresPrescription"
                            name="requiresPrescription"
                            checked={product.requiresPrescription}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="requiresPrescription">
                            <strong>This medicine requires a prescription</strong>
                          </label>
                        </div>
                        <small className="text-muted d-block mt-2">
                          If checked, users will be required to upload a valid prescription before purchasing this medicine.
                          Our medical team will verify the prescription before approving the order.
                        </small>
                      </div>
                    </div>
                  </div>
                )}
                
                <ImageUpload 
                  onImagesChange={setImages} 
                  onExpiryPhotoChange={setExpiryPhoto}
                  existingImages={images}
                  existingExpiryPhoto={expiryPhoto}
                />

                <div className="row mt-3">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="price" className="form-label">Price ($)</label>
                    <input type="number" step="0.01" className="form-control" id="price" name="price" value={product.price} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="discountedPrice" className="form-label">Discounted Price ($) <small className="text-muted">(Optional)</small></label>
                    <input type="number" step="0.01" className="form-control" id="discountedPrice" name="discountedPrice" value={product.discountedPrice} onChange={handleChange} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="stock" className="form-label">Stock Quantity</label>
                    <input type="number" className="form-control" id="stock" name="stock" value={product.stock} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                    <input type="date" className="form-control" id="expiryDate" name="expiryDate" value={product.expiryDate} onChange={handleChange} required />
                  </div>
                </div>
                <div className="d-grid mt-3">
                  <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
