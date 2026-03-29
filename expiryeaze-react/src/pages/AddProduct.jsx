import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { config } from '../lib/config';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { GROCERY_OPTIONS, MEDICINE_OPTIONS } from '../lib/constants';
import { Html5QrcodeScanner } from 'html5-qrcode';

const AddProduct = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState({
    name: '',
    barcode: '',
    ingredients: '',
    netWeight: '',
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
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const storedVendorCategory = localStorage.getItem('vendorCategory');
    setVendorSection(storedVendorCategory);

    if (storedVendorCategory === 'groceries') {
      setAvailableCategories(GROCERY_OPTIONS);
      setProduct(prev => ({ ...prev, category: 'groceries' }));
    } else if (storedVendorCategory === 'medicines') {
      setAvailableCategories(MEDICINE_OPTIONS);
      setProduct(prev => ({ ...prev, category: 'medicines' }));
    } else {
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
              barcode: existingProduct.barcode || '', 
              ingredients: existingProduct.ingredients || '',
              netWeight: existingProduct.netWeight || '',
              price: existingProduct.price.toString(),
              discountedPrice: existingProduct.discountedPrice?.toString() || '',
              stock: existingProduct.stock.toString(),
              expiryDate: existingProduct.expiryDate ? new Date(existingProduct.expiryDate).toISOString().split('T')[0] : '',
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

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 150 } }, 
        false
      );

      const onScanSuccess = async (decodedText) => {
        scanner.clear(); // Turn off webcam
        setShowScanner(false);
        setIsScanning(true);

        // Instantly save the barcode to the form
        setProduct(prev => ({ ...prev, barcode: decodedText }));

        try {
          // 1. FAST CHECK: Local MongoDB
          console.log("1. Checking local Database...");
          try {
            const localRes = await axios.get(`${config.API_URL}/products/barcode/${decodedText}`);
            if (localRes.data.success && localRes.data.data) {
              const item = localRes.data.data;
              setProduct(prev => ({
                ...prev,
                name: item.name || prev.name,
                ingredients: item.ingredients || prev.ingredients,
                netWeight: item.netWeight || prev.netWeight,
                price: item.price ? item.price.toString() : prev.price,
                category: item.category || prev.category
              }));
              alert("Product found in your database! Fully autofilled.");
              setIsScanning(false);
              return; // STOP HERE!
            }
          } catch (localErr) {
            console.log("Not found locally. Checking global database...");
          }

          // 2. FAST CHECK: Open Food Facts
          console.log("2. Checking Open Food Facts...");
          const offRes = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
          
          let foundName = '';
          let foundIngredients = '';
          let foundWeight = '';
          let foundImage = '';

          if (offRes.data.status === 1) {
            const item = offRes.data.product;
            foundName = item.product_name || '';
            foundIngredients = item.ingredients_text || '';
            foundWeight = item.quantity || '';
            foundImage = item.image_url || '';
          }

          // Update the React Form
          setProduct(prev => ({
            ...prev,
            name: foundName || prev.name,
            ingredients: foundIngredients || prev.ingredients,
            netWeight: foundWeight || prev.netWeight,
          }));

          if (foundImage) {
            setImages([{ id: 'scanned-img', url: foundImage, type: 'product', alt: 'product' }]);
          }

          // Simplified Alerts
          if (!foundName) {
             alert("Barcode captured! New product. Please enter details manually.");
          } else {
             alert(`${foundName} found! Please fill in any missing details like Price and Expiry.`);
          }

        } catch (error) {
          console.error("Scanner Error:", error);
          alert("Failed to connect to databases. Barcode saved.");
        } finally {
          setIsScanning(false);
        }
      };

      scanner.render(onScanSuccess, (err) => { });

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [showScanner]);

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
      barcode: product.barcode, 
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
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      if (isEditMode) {
        await axios.put(`${config.API_URL}/products/${id}`, productData, { headers: authHeaders });
      } else {
        await axios.post(`${config.API_URL}/products`, productData, { headers: authHeaders });
      }

      navigate(vendorSection === 'medicines' ? '/medicines-dashboard' : '/vendor-dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save product.');
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

              {/* BARCODE SCANNER UI */}
              <div className="mb-4 p-3 bg-light rounded border border-primary border-opacity-25 text-center">
                <label className="form-label fw-bold text-primary d-block mb-3">
                  <i className="fas fa-barcode me-2"></i> Scan Product Barcode
                </label>
                
                {!showScanner ? (
                  <button 
                    type="button" 
                    className="btn btn-outline-primary" 
                    onClick={() => setShowScanner(true)}
                    disabled={isScanning}
                  >
                    {isScanning ? 'Fetching Product Data...' : 'Open Webcam to Scan Barcode'}
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-danger mb-3" 
                    onClick={() => setShowScanner(false)}
                  >
                    Cancel Scan
                  </button>
                )}

                {showScanner && <div id="reader" className="mx-auto" style={{ maxWidth: '400px' }}></div>}
              </div>
              
              <form onSubmit={handleSubmit}>
                
                {/* Captured Barcode Display */}
                {product.barcode && (
                  <div className="mb-3">
                    <label className="form-label text-success fw-bold">
                      <i className="fas fa-check-circle me-1"></i> Captured Barcode
                    </label>
                    <input type="text" className="form-control border-success bg-light" value={product.barcode} readOnly disabled />
                  </div>
                )}

                <ImageUpload
                  onImagesChange={setImages}
                  onExpiryPhotoChange={setExpiryPhoto}
                  existingImages={images}
                  existingExpiryPhoto={expiryPhoto}
                />

                <div className="mb-3 mt-4">
                  <label htmlFor="name" className="form-label">Product Name</label>
                  <input type="text" className="form-control" id="name" name="name" value={product.name} onChange={handleChange} required />
                </div>
                
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label htmlFor="ingredients" className="form-label">Ingredients</label>
                    <textarea className="form-control" id="ingredients" name="ingredients" rows={3} value={product.ingredients} onChange={handleChange} required placeholder="e.g. Rolled Oats, Honey, Almonds..." />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="netWeight" className="form-label">Net Weight / Content</label>
                    <input type="text" className="form-control" id="netWeight" name="netWeight" value={product.netWeight} onChange={handleChange} required placeholder="e.g. 100g or 1 L" />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select className="form-select" id="category" name="category" value={product.category} onChange={handleChange} required>
                    {availableCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

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
                      </div>
                    </div>
                  </div>
                )}

                <div className="row mt-3">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="price" className="form-label">Price (₹)</label>
                    <input type="number" step="0.01" className="form-control" id="price" name="price" value={product.price} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="discountedPrice" className="form-label">Discounted Price (₹) <small className="text-muted">(Optional)</small></label>
                    <input type="number" step="0.01" className="form-control" id="discountedPrice" name="discountedPrice" value={product.discountedPrice} onChange={handleChange} />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="stock" className="form-label">Stock Quantity</label>
                    <input type="number" className="form-control" id="stock" name="stock" value={product.stock} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="expiryDate" className="form-label">Expiry Date <small className="text-muted">(Optional)</small></label>
                    <input type="date" className="form-control" id="expiryDate" name="expiryDate" value={product.expiryDate} onChange={handleChange} />
                  </div>
                </div>

                <div className="d-grid mt-4">
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