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
    // Run all database queries in parallel to minimize cross-continental network round-trip delays
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      paidOrders,
      recentOrders,
      statusCounts
    ] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({ role: 'user' }),
      Order.find({ paymentStatus: 'Paid' }).populate('items.product', 'category'),
      Order.find({}).populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ])
    ]);

    // Calculate total sales
    const totalSales = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Sales by Category
    const salesByCategory = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        const category = (item.product && item.product.category) || 'Other';
        salesByCategory[category] = (salesByCategory[category] || 0) + (item.price * item.quantity);
      }
    }

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

    // Daily Sales (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailySalesRaw = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'Paid',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const match = dailySalesRaw.find(item => item._id === dateString);
      dailySales.push({
        date: dateString,
        sales: match ? match.sales : 0
      });
    }

    res.json({
      summary: {
        totalSales,
        totalOrders,
        totalProducts,
        totalUsers
      },
      salesByCategory,
      recentOrders,
      statusCounts: statusObj,
      dailySales
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

// @desc    Get user details by ID for admin
// @route   GET /api/admin/users/:id
// @access  Private (Admin Only)
router.get('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
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
