const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const Config = require('../models/Config');

// @desc    Get global config settings (Public)
// @route   GET /api/config
// @access  Public
router.get('/', async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update global config settings (Admin only)
// @route   PUT /api/config
// @access  Private (Admin Only)
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }

    const {
      flashSaleEnabled,
      flashSaleEndDate,
      flashSaleDiscountText,
      shippingFeeStandard,
      shippingFeeOutside,
      freeShippingThreshold,
      supportPhone,
      supportEmail,
      facebookUrl,
      instagramUrl
    } = req.body;

    if (flashSaleEnabled !== undefined) config.flashSaleEnabled = flashSaleEnabled;
    if (flashSaleEndDate !== undefined) config.flashSaleEndDate = flashSaleEndDate;
    if (flashSaleDiscountText !== undefined) config.flashSaleDiscountText = flashSaleDiscountText;
    if (shippingFeeStandard !== undefined) config.shippingFeeStandard = Number(shippingFeeStandard);
    if (shippingFeeOutside !== undefined) config.shippingFeeOutside = Number(shippingFeeOutside);
    if (freeShippingThreshold !== undefined) config.freeShippingThreshold = Number(freeShippingThreshold);
    if (supportPhone !== undefined) config.supportPhone = supportPhone;
    if (supportEmail !== undefined) config.supportEmail = supportEmail;
    if (facebookUrl !== undefined) config.facebookUrl = facebookUrl;
    if (instagramUrl !== undefined) config.instagramUrl = instagramUrl;

    const updated = await config.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
