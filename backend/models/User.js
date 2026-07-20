const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zip: { type: String, required: true },
  country: { type: String, default: 'Bangladesh' }
});

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String },
  addresses: [addressSchema],
  cart: [{
    product: { type: String },
    title: { type: String },
    image: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    stock: { type: Number }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
