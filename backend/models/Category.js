const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  parent: { type: String, enum: ['Men', 'Women', 'Accessories'], required: true },
  image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
