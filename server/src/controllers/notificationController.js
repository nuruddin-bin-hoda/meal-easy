const mongoose = require('mongoose');
const { User, Chef, Notification } = require('../models');

const subscribe = async (req, res) => {
  const { userId, role } = req.user;
  const { subscription } = req.body;

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    return res.status(400).json({ message: 'Invalid subscription object.' });
  }

  const update = {
    notificationSubscription: {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    },
  };

  if (role === 'chef') {
    await Chef.findByIdAndUpdate(userId, update);
  } else {
    await User.findByIdAndUpdate(userId, update);
  }

  res.json({ message: 'Subscribed.' });
};

const getNotifications = async (req, res) => {
  const { userId } = req.user;
  const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '20', 10)));
  const skip = (page - 1) * limit;

  const userObjId = new mongoose.Types.ObjectId(userId);

  const [notifications, total] = await Promise.all([
    Notification.find({ userId: userObjId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId: userObjId }),
  ]);

  res.json({
    data: notifications,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

const markRead = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: new mongoose.Types.ObjectId(userId) },
    { isRead: true },
    { new: true },
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  res.json(notification);
};

module.exports = { subscribe, getNotifications, markRead };
