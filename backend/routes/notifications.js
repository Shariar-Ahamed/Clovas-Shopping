const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ firebaseUid: req.user.firebaseUid })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark all user notifications as read
// @route   POST /api/notifications/mark-read
// @access  Private
router.post('/mark-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { firebaseUid: req.user.firebaseUid, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a notification (Internal/Admin utility helper, not exposed to standard UI client)
// @route   POST /api/notifications
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const notification = await Notification.create({
      firebaseUid: req.user.firebaseUid,
      title,
      message,
      type
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
