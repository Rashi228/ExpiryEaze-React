import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../lib/config';
import { useAuth } from './AuthContext';

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
  const API_URL = config.API_URL;

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/cart?userId=${user.id}`);
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
      await axios.post(`${API_URL}/cart`, { userId: user.id, productId, quantity });
      await fetchCart(); // Refetch cart to get updated state
    } catch (err) {
      setError('Failed to add item to cart.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
     if (!user) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/cart`, { data: { userId: user.id, itemId } });
      await fetchCart();
    } catch (err) {
      setError('Failed to remove item from cart.');
    } finally {
      setLoading(false);
    }
  };
  
  const clearCart = async () => {
    // This would typically be another API endpoint, for now we clear locally and can add it later
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, loading, error, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
