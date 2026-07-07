const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// @desc    Get admin analytics overview
// @route   GET /api/admin/analytics
// @access  Private (Admin Only)
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Calculate total sales
    const paidOrders = await Order.find({ paymentStatus: 'Paid' });
    const totalSales = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Sales by Category
    const salesByCategory = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const category = product.category || 'Other';
          salesByCategory[category] = (salesByCategory[category] || 0) + (item.price * item.quantity);
        }
      }
    }

    // Recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Order status count
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const statusObj = {
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };
    statusCounts.forEach((status) => {
      if (status._id in statusObj) {
        statusObj[status._id] = status.count;
      }
    });

    res.json({
      summary: {
        totalSales,
        totalOrders,
        totalProducts,
        totalUsers
      },
      salesByCategory,
      recentOrders,
      statusCounts: statusObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all users for user management
// @route   GET /api/admin/users
// @access  Private (Admin Only)
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin Only)
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = role;
    await user.save();
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
