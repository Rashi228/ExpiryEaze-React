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
    category: 'groceries',
  });
  
  const [images, setImages] = useState([]);
  const [expiryPhoto, setExpiryPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
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

    const productData = {
      ...product,
      vendor: user.id,
      vendorName: user.name,
      price: parseFloat(product.price),
      stock: parseInt(product.stock, 10),
      discountedPrice: product.discountedPrice ? parseFloat(product.discountedPrice) : undefined,
      images: images.map(img => img.url),
      expiryPhoto: expiryPhoto,
    };

    try {
      if (isEditMode) {
        await axios.put(`${config.API_URL}/products/${id}`, productData);
      } else {
        await axios.post(`${config.API_URL}/products`, productData);
      }
      navigate('/vendor-dashboard');
    } catch (err) {
      setError('Failed to save product. Please check your inputs.');
      console.error(err);
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
                  <label htmlFor="category" className="form-label">Category</label>
                  <input type="text" className="form-control" id="category" name="category" value="groceries" disabled />
                </div>
                
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
