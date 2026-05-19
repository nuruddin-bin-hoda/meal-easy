const cron = require('node-cron');
const { MessSettings, Stock } = require('../models');
const { sendPushToAllUsers, sendPushToAdmins } = require('../utils/pushService');

// Tracks which reminders have already been sent today: "<mealTypeId>-<YYYY-MM-DD>-<HH:MM>"
const sentKeys = new Set();

function to12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getNowMinsInTz(timezone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === 'hour').value, 10);
  const m = parseInt(parts.find((p) => p.type === 'minute').value, 10);
  return h * 60 + m;
}

function getDateStrInTz(timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}

async function sendCutoffReminders(settings, nowMins) {
  if (!settings?.timezone) {
    console.warn('[cronJobs] Cutoff reminder skipped: timezone not configured');
    return;
  }
  if (!settings.cutoffReminderMinutes || !settings.mealTypes?.length) return;

  const dateStr = getDateStrInTz(settings.timezone);

  for (const mt of settings.mealTypes) {
    if (!mt.isActive || !mt.cutoffTime) continue;

    const [hh, mm] = mt.cutoffTime.split(':').map(Number);
    const reminderMins = hh * 60 + mm - settings.cutoffReminderMinutes;
    if (reminderMins < 0) continue;
    if (nowMins !== reminderMins) continue;

    const key = `${mt._id}-${dateStr}-${mt.cutoffTime}`;
    if (sentKeys.has(key)) continue;
    sentKeys.add(key);

    await sendPushToAllUsers({
      title: 'Meal Reminder',
      body:  `${mt.name} toggle closes at ${to12h(mt.cutoffTime)}. Don't forget!`,
    });
  }
}

// On startup, send any reminder that was due in the last 5 minutes but missed (e.g. server restart).
async function runStartupRecovery(settings) {
  if (!settings?.timezone || !settings.cutoffReminderMinutes || !settings.mealTypes?.length) return;

  const nowMins = getNowMinsInTz(settings.timezone);
  const dateStr = getDateStrInTz(settings.timezone);

  for (const mt of settings.mealTypes) {
    if (!mt.isActive || !mt.cutoffTime) continue;

    const [hh, mm] = mt.cutoffTime.split(':').map(Number);
    const reminderMins = hh * 60 + mm - settings.cutoffReminderMinutes;
    if (reminderMins < 0) continue;

    const minsAgo = nowMins - reminderMins;
    if (minsAgo < 0 || minsAgo >= 5) continue;

    const key = `${mt._id}-${dateStr}-${mt.cutoffTime}`;
    if (sentKeys.has(key)) continue;
    sentKeys.add(key);

    console.log(`[cronJobs] Startup recovery: sending missed reminder for ${mt.name}`);
    await sendPushToAllUsers({
      title: 'Meal Reminder',
      body:  `${mt.name} toggle closes at ${to12h(mt.cutoffTime)}. Don't forget!`,
    });
  }
}

async function startCronJobs() {
  const settings  = await MessSettings.findOne();
  const timezone  = settings?.timezone || 'UTC';

  // Job 1: Per-meal-type cutoff reminder — checked every minute in mess timezone
  cron.schedule('* * * * *', async () => {
    try {
      const current = await MessSettings.findOne();
      if (!current?.timezone) {
        console.warn('[cronJobs] Cutoff reminder skipped: timezone not configured');
        return;
      }
      const nowMins = getNowMinsInTz(current.timezone);
      await sendCutoffReminders(current, nowMins);
    } catch (err) {
      console.error('[cronJobs] cutoff reminder error:', err.message);
    }
  });

  // Job 2: Low-stock check — daily at 08:00 in mess timezone
  cron.schedule('0 8 * * *', async () => {
    try {
      const lowItems = await Stock.find({
        isArchived: false,
        $expr: { $lte: ['$quantity', '$lowThreshold'] },
      });
      for (const item of lowItems) {
        await sendPushToAdmins({
          title: 'Low Stock Alert',
          body:  `${item.itemName} is running low (${item.quantity} ${item.unit}).`,
        });
      }
    } catch (err) {
      console.error('[cronJobs] low stock check error:', err.message);
    }
  }, { timezone });

  // Job 3: Clear deduplication keys daily at midnight in mess timezone
  cron.schedule('0 0 * * *', () => {
    sentKeys.clear();
  }, { timezone });

  // Startup recovery: catch reminders missed during server downtime
  try {
    await runStartupRecovery(settings);
  } catch (err) {
    console.error('[cronJobs] startup recovery error:', err.message);
  }

  console.log('[cronJobs] Scheduled jobs started.');
}

module.exports = { startCronJobs };
