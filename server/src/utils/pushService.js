const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = require('../config/env');
const { User, Chef, Notification } = require('../models');

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function _send(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch {
    // Fire-and-forget: swallow delivery errors (expired/invalid subscriptions)
  }
}

async function _saveNotification(userId, { title, body, data }) {
  try {
    await Notification.create({
      userId,
      event: data?.event ?? title,
      message: body,
    });
  } catch {
    // Non-critical — do not block push delivery
  }
}

async function sendPushToUser(userId, { title, body, data = {} }) {
  const [user, chef] = await Promise.all([
    User.findById(userId).select('notificationSubscription'),
    Chef.findById(userId).select('notificationSubscription'),
  ]);

  const actor = user ?? chef;
  if (actor?.notificationSubscription?.endpoint) {
    await _send(actor.notificationSubscription, { title, body, data });
  }

  // Save Notification doc only for User records (Notification.userId refs User)
  if (user) {
    await _saveNotification(userId, { title, body, data });
  }
}

async function sendPushToAdmins({ title, body, data = {} }) {
  const admins = await User.find({
    role: { $in: ['admin', 'superadmin'] },
    status: 'active',
    'notificationSubscription.endpoint': { $exists: true },
  }).select('_id notificationSubscription');

  await Promise.all(
    admins.map(async (admin) => {
      await _send(admin.notificationSubscription, { title, body, data });
      await _saveNotification(admin._id, { title, body, data });
    }),
  );
}

async function sendPushToAllUsers({ title, body, data = {} }) {
  const users = await User.find({
    status: 'active',
    'notificationSubscription.endpoint': { $exists: true },
  }).select('_id notificationSubscription');

  await Promise.all(
    users.map(async (u) => {
      await _send(u.notificationSubscription, { title, body, data });
      await _saveNotification(u._id, { title, body, data });
    }),
  );
}

module.exports = { sendPushToUser, sendPushToAdmins, sendPushToAllUsers };
