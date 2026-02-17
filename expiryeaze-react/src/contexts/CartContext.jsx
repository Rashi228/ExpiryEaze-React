import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../lib/config';
import { useAuth } from './AuthContext';

const api = axios.create({
  baseURL: config.API_URL,
});

api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/cart');
      if (res.data.success && res.data.cart) {
        setCartItems(res.data.cart.items);
      }
    } catch (err) {
      setError('Failed to fetch cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity) => {
    if (!user) {
      setError('You must be logged in to add items to the cart.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/cart', { productId, quantity });
      await fetchCart(); // Refetch cart to get updated state
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add item to cart.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.delete('/cart', { data: { itemId } });
      await fetchCart();
    } catch (err) {
      // Handle "Cart not found" (404) by clearing local state
      if (err.response && err.response.status === 404) {
        setCartItems([]);
        return;
      }
      setError(err.response?.data?.error || 'Failed to remove item from cart.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!user) return;
    setLoading(true);
    try {
      console.log('🛒 Updating quantity:', { itemId, newQuantity, userId: user.id });

      if (newQuantity <= 0) {
        // If quantity is 0 or less, remove the item
        console.log('🗑️ Removing item from cart');
        await removeFromCart(itemId);
      } else {
        // Update quantity
        console.log('📝 Updating quantity via API');
        const response = await api.put('/cart', {
          itemId,
          quantity: newQuantity
        });
        console.log('✅ API Response:', response.data);
        await fetchCart();
      }
    } catch (err) {
      console.error('❌ Update quantity error:', err);

      // Handle "Cart not found" (404) by clearing local state
      if (err.response && err.response.status === 404) {
        console.warn('⚠️ Cart not found on server. Clearing local cart to sync.');
        setCartItems([]);
        // Don't throw, just let the UI update to empty
        return;
      }

      console.error('❌ Error details:', err.response?.data);
      const msg = err.response?.data?.error || err.message;
      setError(`Failed to update item quantity: ${msg}`);
      // Throw for other errors so UI can react if needed
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    // This would typically be another API endpoint, for now we clear locally and can add it later
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, loading, error, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
