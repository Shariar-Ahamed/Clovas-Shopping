const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Initialize SSLCommerz
const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'testbox';
const isSandboxMode = process.env.SSLCOMMERZ_SANDBOX !== 'false'; // Default to true

// @desc    Initiate SSLCommerz payment session
// @route   POST /api/payments/initiate/:orderId
// @access  Private
router.post('/initiate/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/frontend';

    const paymentData = {
      total_amount: order.totalAmount,
      currency: 'BDT',
      tran_id: order.transactionId,
      success_url: `${backendUrl}/api/payments/success?tranId=${order.transactionId}&frontend=${encodeURIComponent(frontendUrl)}`,
      fail_url: `${backendUrl}/api/payments/fail?tranId=${order.transactionId}&frontend=${encodeURIComponent(frontendUrl)}`,
      cancel_url: `${backendUrl}/api/payments/cancel?tranId=${order.transactionId}&frontend=${encodeURIComponent(frontendUrl)}`,
      ipn_url: `${backendUrl}/api/payments/ipn`,
      shipping_method: 'Courier',
      product_name: order.items.map((i) => i.title).join(', ').substring(0, 150),
      product_category: 'Apparel',
      product_profile: 'general',
      cus_name: order.shippingAddress.name,
      cus_email: order.user.email,
      cus_add1: order.shippingAddress.street,
      cus_add2: order.shippingAddress.city,
      cus_city: order.shippingAddress.city,
      cus_state: order.shippingAddress.city,
      cus_postcode: order.shippingAddress.zip,
      cus_country: order.shippingAddress.country,
      cus_phone: order.shippingAddress.phone,
      ship_name: order.shippingAddress.name,
      ship_add1: order.shippingAddress.street,
      ship_city: order.shippingAddress.city,
      ship_state: order.shippingAddress.city,
      ship_postcode: order.shippingAddress.zip,
      ship_country: order.shippingAddress.country,
    };

    // If sandbox / test credentials, mock redirection to bypass setup errors for the client
    if (store_id === 'testbox' || process.env.MOCK_PAYMENT === 'true') {
      console.log('Initiating mock SSLCommerz payment for testing');
      const mockSuccessRedirectUrl = `${backendUrl}/api/payments/success?tranId=${order.transactionId}&frontend=${encodeURIComponent(frontendUrl)}`;
      return res.json({
        GatewayPageURL: mockSuccessRedirectUrl,
        message: 'Mock payment gateway initiated (Sandbox/Development Mode)'
      });
    }

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, isSandboxMode);
    sslcz.init(paymentData).then(async (apiResponse) => {
      if (apiResponse.GatewayPageURL) {
        order.sslSessionId = apiResponse.sessionkey;
        await order.save();
        res.json({ GatewayPageURL: apiResponse.GatewayPageURL });
      } else {
        res.status(400).json({ message: 'Payment initiation failed', details: apiResponse });
      }
    }).catch(err => {
      console.error('SSLCommerz Initialization Error:', err);
      res.status(500).json({ message: 'SSLCommerz payment init server error' });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Payment success handler (SSLCommerz redirects here via POST/GET)
// @route   POST/GET /api/payments/success
// @access  Public
router.all('/success', async (req, res) => {
  try {
    const { tranId, frontend } = req.query;
    const order = await Order.findOne({ transactionId: tranId });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.paymentStatus = 'Paid';
    await order.save();

    // Redirect user back to frontend dashboard with success state
    const redirectTarget = `${decodeURIComponent(frontend)}/dashboard.html?status=success&txnId=${tranId}`;
    res.redirect(redirectTarget);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// @desc    Payment fail handler
// @route   POST/GET /api/payments/fail
// @access  Public
router.all('/fail', async (req, res) => {
  try {
    const { tranId, frontend } = req.query;
    const order = await Order.findOne({ transactionId: tranId });

    if (order) {
      order.paymentStatus = 'Failed';
      await order.save();
      
      // Restore product stock on payment failure
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    const redirectTarget = `${decodeURIComponent(frontend)}/dashboard.html?status=failed&txnId=${tranId}`;
    res.redirect(redirectTarget);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// @desc    Payment cancel handler
// @route   POST/GET /api/payments/cancel
// @access  Public
router.all('/cancel', async (req, res) => {
  try {
    const { tranId, frontend } = req.query;
    const order = await Order.findOne({ transactionId: tranId });

    if (order) {
      order.paymentStatus = 'Cancelled';
      await order.save();

      // Restore product stock on payment cancel
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    const redirectTarget = `${decodeURIComponent(frontend)}/dashboard.html?status=cancelled&txnId=${tranId}`;
    res.redirect(redirectTarget);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// @desc    Instant Payment Notification (IPN) Webhook
// @route   POST /api/payments/ipn
// @access  Public
router.post('/ipn', async (req, res) => {
  try {
    const { tran_id, status } = req.body;
    const order = await Order.findOne({ transactionId: tran_id });

    if (order) {
      if (status === 'VALID' || status === 'VALIDATED') {
        order.paymentStatus = 'Paid';
      } else if (status === 'FAILED') {
        order.paymentStatus = 'Failed';
        // Restore stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
      await order.save();
    }
    res.status(200).send('IPN Processed');
  } catch (error) {
    console.error('IPN processing error:', error);
    res.status(500).send('IPN processing failed');
  }
});

module.exports = router;
