const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = require('../config/env');
const { User, Chef, Notification } = require('../models');

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// userId and userModel are required so expired subscriptions can be cleaned up.
async function _send(subscription, payload, userId, userModel) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription is expired or gone — remove it from the database.
      const Model = userModel === 'Chef' ? Chef : User;
      await Model.findByIdAndUpdate(userId, { $unset: { notificationSubscription: 1 } }).catch(() => {});
    } else {
      console.error(`[push] delivery failed for ${userModel}:${userId}: ${err.message}`);
    }
  }
}

async function _saveNotification(userId, { title, body, data }, userModel = 'User') {
  try {
    await Notification.create({
      userId,
      userModel,
      event:   data?.event ?? title,
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

  const actor     = user ?? chef;
  const userModel = user ? 'User' : 'Chef';

  if (actor?.notificationSubscription?.endpoint) {
    await _send(actor.notificationSubscription, { title, body, data }, actor._id, userModel);
  }

  await _saveNotification(userId, { title, body, data }, userModel);
}

async function sendPushToAdmins({ title, body, data = {} }) {
  const admins = await User.find({
    role:   { $in: ['admin', 'superadmin'] },
    status: 'active',
    'notificationSubscription.endpoint': { $exists: true },
  }).select('_id notificationSubscription');

  await Promise.all(
    admins.map(async (admin) => {
      await _send(admin.notificationSubscription, { title, body, data }, admin._id, 'User');
      await _saveNotification(admin._id, { title, body, data }, 'User');
    }),
  );
}

// Sends to all active Users AND all active Chefs with a valid subscription.
async function sendPushToAllUsers({ title, body, data = {} }) {
  const [users, chefs] = await Promise.all([
    User.find({
      status: 'active',
      'notificationSubscription.endpoint': { $exists: true },
    }).select('_id notificationSubscription'),
    Chef.find({
      isActive: true,
      'notificationSubscription.endpoint': { $exists: true },
    }).select('_id notificationSubscription'),
  ]);

  const targets = [
    ...users.map((u) => ({ doc: u, model: 'User' })),
    ...chefs.map((c) => ({ doc: c, model: 'Chef' })),
  ];

  await Promise.all(
    targets.map(async ({ doc, model }) => {
      await _send(doc.notificationSubscription, { title, body, data }, doc._id, model);
      await _saveNotification(doc._id, { title, body, data }, model);
    }),
  );
}

module.exports = { sendPushToUser, sendPushToAdmins, sendPushToAllUsers };
