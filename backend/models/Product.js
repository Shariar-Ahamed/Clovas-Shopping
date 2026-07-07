const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  images: [{ type: String, required: true }],
  category: { type: String, required: true }, // Men, Women, Accessories
  subCategory: { type: String, required: true }, // e.g. Shirts, Kurti, Watches
  gender: { type: String, enum: ['Men', 'Women', 'Accessories', 'Unisex'], required: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  ratings: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: true },
  flashSale: {
    isFlashSale: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Helper to get active price (accounts for discountPrice or flashSale)
productSchema.virtual('activePrice').get(function() {
  if (this.flashSale && this.flashSale.isFlashSale) {
    return this.price * (1 - this.flashSale.discountPercent / 100);
  }
  if (this.discountPrice && this.discountPrice > 0) {
    return this.discountPrice;
  }
  return this.price;
});

module.exports = mongoose.model('Product', productSchema);
