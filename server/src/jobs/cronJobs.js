const cron = require('node-cron');
const { MessSettings, Stock } = require('../models');
const { sendPushToAllUsers, sendPushToAdmins } = require('../utils/pushService');

function startCronJobs() {
  // Job 1: Cutoff Reminder — checks every minute
  cron.schedule('* * * * *', async () => {
    try {
      const settings = await MessSettings.findOne();
      if (!settings?.cutoffTime || !settings?.cutoffReminderMinutes) return;

      const [hh, mm] = settings.cutoffTime.split(':').map(Number);
      const cutoffTotalMins = hh * 60 + mm;
      const reminderTotalMins = cutoffTotalMins - settings.cutoffReminderMinutes;
      if (reminderTotalMins < 0) return;

      const now = new Date();
      const nowTotalMins = now.getHours() * 60 + now.getMinutes();

      if (nowTotalMins === reminderTotalMins) {
        await sendPushToAllUsers({
          title: 'Meal Toggle Reminder',
          body: `Meal toggle closes at ${settings.cutoffTime}. Don't forget!`,
        });
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
