const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true } // Price at the time of purchase
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'Bangladesh' }
  },
  paymentMethod: { type: String, enum: ['SSLCommerz', 'COD'], default: 'SSLCommerz' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Cancelled'], default: 'Pending' },
  orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String },
  transactionId: { type: String, required: true, unique: true },
  sslSessionId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
