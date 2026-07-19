const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Sync Firebase Auth with MongoDB User
// @route   POST /api/auth/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    // protect middleware already syncs the user and sets req.user
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add shipping address
// @route   POST /api/auth/address
// @access  Private
router.post('/address', protect, async (req, res) => {
  try {
    const { street, city, state, zip, country } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.addresses.push({ street, city, state, zip, country });
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete shipping address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
router.delete('/address/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.addresses = user.addresses.filter(
        (addr) => addr._id.toString() !== req.params.addressId
      );
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Firebase Client SDK Config
// @route   GET /api/auth/firebase-config
// @access  Public
router.get('/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
  });
});

module.exports = router;
