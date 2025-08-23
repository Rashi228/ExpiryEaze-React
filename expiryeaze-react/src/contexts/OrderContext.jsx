import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { config } from '../lib/config';
import { useAuth } from './AuthContext';

const OrderContext = createContext(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = config.API_URL;

  const placeOrder = async (cartItems, totalAmount, shippingAddress) => {
    if (!user) {
      setError('You must be logged in to place an order.');
      return false;
    }
    setLoading(true);
    try {
      const orderProducts = cartItems.map(item => ({
        product: item.product._id, // Assuming product object has _id
        quantity: item.quantity,
        price: item.product.discountedPrice || item.product.price,
      }));

      const res = await axios.post(`${API_URL}/orders`, {
        userId: user.id,
        products: orderProducts,
        totalAmount,
        shippingAddress,
      });

      if (res.data.success) {
        await fetchOrders(); // Refresh orders list
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to place order.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders?userId=${user.id}`);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      setError('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, loading, error, placeOrder, fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
};
