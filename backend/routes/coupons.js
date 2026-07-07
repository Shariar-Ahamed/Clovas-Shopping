const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Private
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, cartAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isValid(cartAmount)) {
      return res.status(400).json({ 
        message: 'Coupon is either expired, inactive, or your cart amount is below the minimum required purchase limit.' 
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartAmount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all coupons (Admin Only)
// @route   GET /api/coupons
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ expiryDate: 1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, expiryDate } = req.body;

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ message: 'Coupon already exists' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      expiryDate: new Date(expiryDate)
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
