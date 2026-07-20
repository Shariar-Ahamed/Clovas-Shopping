const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  flashSaleEnabled: { type: Boolean, default: true },
  flashSaleEndDate: { 
    type: Date, 
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
  },
  flashSaleDiscountText: { type: String, default: "Upto 50% Off" },
  shippingFeeStandard: { type: Number, default: 60 },
  shippingFeeOutside: { type: Number, default: 120 },
  freeShippingThreshold: { type: Number, default: 2000 },
  supportPhone: { type: String, default: "+880 1700-000000" },
  supportEmail: { type: String, default: "support@clovas.com" },
  facebookUrl: { type: String, default: "https://facebook.com/clovas" },
  instagramUrl: { type: String, default: "https://instagram.com/clovas" }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
