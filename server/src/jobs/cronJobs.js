const cron = require('node-cron');
const { MessSettings, Stock } = require('../models');
const { sendPushToAllUsers, sendPushToAdmins } = require('../utils/pushService');

function startCronJobs() {
  // Job 1: Per-meal-type cutoff reminder — checks every minute
  cron.schedule('* * * * *', async () => {
    try {
      const settings = await MessSettings.findOne();
      if (!settings?.cutoffReminderMinutes || !settings?.mealTypes?.length) return;

      const timezone = settings.timezone ?? 'Asia/Dhaka';
      const now = new Date();

      // Get current time in the mess timezone
      const tzFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = tzFormatter.formatToParts(now);
      const currentHour = parseInt(parts.find(p => p.type === 'hour').value);
      const currentMin  = parseInt(parts.find(p => p.type === 'minute').value);
      const nowTotalMins = currentHour * 60 + currentMin;

      for (const mt of settings.mealTypes) {
        if (!mt.isActive || !mt.cutoffTime) continue;

        const [hh, mm] = mt.cutoffTime.split(':').map(Number);
        const cutoffTotalMins = hh * 60 + mm;
        const reminderTotalMins = cutoffTotalMins - settings.cutoffReminderMinutes;
        if (reminderTotalMins < 0) continue;

        if (nowTotalMins === reminderTotalMins) {
          await sendPushToAllUsers({
            title: 'Meal Reminder',
            body: `${mt.name} toggle closes at ${mt.cutoffTime}. Don't forget!`,
          });
        }
      }
    } catch (err) {
      console.error('[cronJobs] cutoff reminder error:', err.message);
    }
  });

  // Job 2: Low Stock Check — daily at 08:00
  cron.schedule('0 8 * * *', async () => {
    try {
      const lowItems = await Stock.find({
        isArchived: false,
        $expr: { $lte: ['$quantity', '$lowThreshold'] },
      });

      for (const item of lowItems) {
        await sendPushToAdmins({
          title: 'Low Stock Alert',
          body: `${item.itemName} is running low (${item.quantity} ${item.unit}).`,
        });
      }
    } catch (err) {
      console.error('[cronJobs] low stock check error:', err.message);
    }
  });

  console.log('[cronJobs] Scheduled jobs started.');
}

module.exports = { startCronJobs };
