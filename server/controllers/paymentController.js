const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with Test Mode keys from environment
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/**
 * POST /api/payment/order
 * Creates a Razorpay order with amount (in paise) and currency (INR).
 * Body: { amount, currency?, receipt? }
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = `receipt_${Date.now()}` } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount (in paise for INR) is required',
      });
    }

    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(Number(amount)), // Razorpay expects amount in smallest currency unit (paise for INR)
      currency: currency.toUpperCase(),
      receipt,
    };

    const order = await razorpay.orders.create(options);

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create payment order',
    });
  }
};

/**
 * POST /api/payment/verify
 * Verifies the razorpay_signature using HMAC SHA256.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        error: 'Server payment configuration error',
      });
    }

    // Razorpay signature is HMAC SHA256 of (order_id + "|" + payment_id)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: invalid signature',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      razorpay_payment_id,
      razorpay_order_id,
    });
  } catch (err) {
    console.error('Razorpay verify payment error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Payment verification failed',
    });
  }
};
