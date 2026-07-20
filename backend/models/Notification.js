const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'promo', 'account'], default: 'account' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add index for fast querying by user and read status
notificationSchema.index({ firebaseUid: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
