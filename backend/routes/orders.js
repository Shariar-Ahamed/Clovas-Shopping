const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Helper to generate a unique transaction ID
const generateTxnId = () => {
  return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// @desc    Create a new order (Pending state)
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, discountAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Verify stock and fetch correct prices
    const orderItems = [];
    let subTotal = 0;

    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ message: `Product ${item.title} not found` });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${dbProduct.title}. Available: ${dbProduct.stock}` });
      }

      // Decrement stock
      dbProduct.stock -= item.quantity;
      await dbProduct.save();

      // Use active price from virtual
      const price = dbProduct.discountPrice && dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      subTotal += price * item.quantity;

      orderItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        image: dbProduct.images[0],
        quantity: item.quantity,
        price
      });
    }

    const totalAmount = Math.max(0, subTotal - (discountAmount || 0));

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || '',
      transactionId: generateTxnId(),
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending'
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      // Check ownership
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all orders (Admin Only)
// @route   GET /api/orders
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status / payment status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin Only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;

      // If order is cancelled, return the stocks
      if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          });
        }
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
