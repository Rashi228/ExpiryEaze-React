import React, { useCallback } from 'react';
import { config } from '../lib/config';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Load Razorpay checkout script dynamically.
 * @returns {Promise<boolean>} Resolves when script is loaded.
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Get base API URL (without /api/v1) for payment endpoints.
 */
const getPaymentBaseUrl = () => config.getPaymentBaseUrl?.() || 'http://localhost:5001';

/**
 * Reusable Razorpay Payment component (Test Mode).
 * Use handlePayment(amountInPaise, options) to open the checkout.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Content for the pay button (default: "Pay with Razorpay")
 * @param {string} [props.className] - CSS class for the button wrapper
 */
const RazorpayPayment = ({ children, className }) => {
  /**
   * Opens Razorpay checkout, then verifies payment on your backend.
   *
   * @param {number} amountInPaise - Amount in paise (e.g. 50000 = ₹500 for INR)
   * @param {Object} [options] - Optional: { currency, receipt, name, description, prefill }
   * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
   */
  const handlePayment = useCallback(async (amountInPaise, options = {}) => {
    const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
    if (!keyId) {
      console.error('REACT_APP_RAZORPAY_KEY_ID is not set in .env');
      return { success: false, error: 'Payment key not configured' };
    }

    const baseUrl = getPaymentBaseUrl();
    const orderUrl = `${baseUrl}/api/payment/order`;
    const verifyUrl = `${baseUrl}/api/payment/verify`;

    try {
      // 1. Fetch order ID from backend
      const orderRes = await fetch(orderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: options.currency || 'INR',
          receipt: options.receipt || `receipt_${Date.now()}`,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success || !orderData.orderId) {
        return {
          success: false,
          error: orderData.error || 'Failed to create order',
        };
      }

      const orderId = orderData.orderId;

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        return { success: false, error: 'Failed to load payment script' };
      }

      // 3. Open Razorpay checkout (Test Mode key)
      return new Promise((resolve) => {
        const razorpayOptions = {
          key: keyId,
          amount: orderData.amount || amountInPaise,
          currency: orderData.currency || 'INR',
          order_id: orderId,
          name: options.name || 'ExpiryEaze',
          description: options.description || 'Payment',
          ...(options.prefill && { prefill: options.prefill }),
          handler: async (response) => {
            try {
              const verifyRes = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                resolve({
                  success: true,
                  data: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    ...verifyData,
                  },
                });
              } else {
                resolve({
                  success: false,
                  error: verifyData.error || 'Verification failed',
                });
              }
            } catch (err) {
              resolve({
                success: false,
                error: err.message || 'Verification request failed',
              });
            }
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment closed' });
            },
          },
        };

        const rzp = new window.Razorpay(razorpayOptions);
        rzp.open();
      });
    } catch (err) {
      console.error('Razorpay error:', err);
      return {
        success: false,
        error: err.message || 'Payment failed',
      };
    }
  }, []);

  return (
    <div className={className}>
      {typeof children === 'function' ? children({ handlePayment }) : children}
    </div>
  );
};

export default RazorpayPayment;
export { loadRazorpayScript, getPaymentBaseUrl };
