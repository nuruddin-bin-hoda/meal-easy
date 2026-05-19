const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  userModel: { type: String, enum: ['User', 'Chef'], default: 'User' },
  event:     String,
  message:   String,
  isRead:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
