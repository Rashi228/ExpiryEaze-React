import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../lib/config';

const ProductContext = createContext({
  products: [],
  loading: false,
  error: null,
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  getProductsByVendor: () => [],
  getProductsByCategory: () => [],
  getProductById: () => undefined,
});

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${config.API_URL}/products`);
        // Map backend product fields to frontend structure if needed
        const mappedProducts = response.data.data.map((p) => ({
          id: p._id,
          name: p.name,
          description: p.description || '',
          category: p.category,
          discountedPrice: p.price, // backend uses 'price'
          originalPrice: p.price,   // adjust if you have both
          expiryDate: p.expiryDate,
          quantity: p.stock || 0,
          images: p.imageUrl ? [{ url: p.imageUrl }] : [],
          vendor: p.vendor || '',
          discount: '',
        }));
        setProducts(mappedProducts);
      } catch (err) {
        setError('Failed to fetch products from backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, ...updates, updatedAt: new Date().toISOString() }
        : product
    ));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const getProductsByVendor = (vendorId) => {
    return products.filter(product => product.vendorId === vendorId);
  };

  const getProductsByCategory = (category) => {
    return products.filter(product => product.category === category);
  };

  const getProductById = (id) => {
    return products.find(product => product.id === id);
  };

  const value = {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByVendor,
    getProductsByCategory,
    getProductById,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
