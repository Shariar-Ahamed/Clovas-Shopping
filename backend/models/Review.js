const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

// Post-save hook to update product ratings and review count
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const reviews = await this.constructor.find({ product: this.product });
  
  const reviewsCount = reviews.length;
  const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviewsCount;
  
  await Product.findByIdAndUpdate(this.product, {
    ratings: avgRating.toFixed(1),
    reviewsCount: reviewsCount
  });
});

module.exports = mongoose.model('Review', reviewSchema);
