const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  discountValue: { type: Number, required: true, min: 0 },
  minPurchase: { type: Number, default: 0, min: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Check if coupon is valid
couponSchema.methods.isValid = function(orderAmount) {
  const now = new Date();
  return this.isActive && now <= this.expiryDate && orderAmount >= this.minPurchase;
};

module.exports = mongoose.model('Coupon', couponSchema);
