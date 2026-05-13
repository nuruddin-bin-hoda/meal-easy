const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { PORT, CLIENT_URL, NODE_ENV } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// ── Startup validation ────────────────────────────────────────────────────────
// Runs once after DB connects. Ensures the app has the minimum required data
// to function without any manual intervention on first boot.
async function runStartupChecks() {
  const { MessSettings, User } = require('./models');

  // Guarantee the MessSettings singleton exists.
  const settings = await MessSettings.findOne();
  if (!settings) {
    await MessSettings.create({
      timezone: 'Asia/Dhaka',
      cutoffReminderMinutes: 30,
      guestMealMonthlyLimit: 5,
      lowBalanceThreshold: 100,
      mealTypes: [
        { name: 'Breakfast', isActive: true,  isAutoEnabled: false, cutoffTime: '22:00' },
        { name: 'Lunch',     isActive: true,  isAutoEnabled: false, cutoffTime: '09:00' },
        { name: 'Dinner',    isActive: true,  isAutoEnabled: false, cutoffTime: '15:00' },
      ],
    });
    console.log('[startup] MessSettings singleton created with defaults.');
  }

  // Warn if no superadmin exists — the app will work but no one can manage it.
  const superadmin = await User.findOne({ role: 'superadmin' });
  if (!superadmin) {
    console.warn(
      '[startup] WARNING: No superadmin account found.\n' +
      '          Run the seed script to create one:\n' +
      '          MONGO_URI=mongodb://localhost:27017/meal-easy node src/scripts/seed.js',
    );
  }
}

// ── DB connect → cron jobs → startup checks ───────────────────────────────────
connectDB()
  .then(async () => {
    await runStartupChecks();
    if (NODE_ENV !== 'test') {
      require('./jobs/cronJobs').startCronJobs();
    }
  })
  .catch((err) => {
    console.error('[startup] Fatal — could not connect to MongoDB:', err.message);
    process.exit(1);
  });

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (used by Docker healthcheck and monitoring)
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', env: NODE_ENV }));

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1',      require('./routes/userRoutes'));
app.use('/api/v1',      require('./routes/adminRoutes'));
app.use('/api/v1',      require('./routes/settingsRoutes'));
app.use('/api/v1',      require('./routes/mealRoutes'));
app.use('/api/v1',      require('./routes/menuRoutes'));
app.use('/api/v1',      require('./routes/chefRoutes'));
app.use('/api/v1',      require('./routes/purchaseRoutes'));
app.use('/api/v1',      require('./routes/otherCostRoutes'));
app.use('/api/v1',      require('./routes/depositRoutes'));
app.use('/api/v1',      require('./routes/billingRoutes'));
app.use('/api/v1',      require('./routes/stockRoutes'));
app.use('/api/v1',      require('./routes/dashboardRoutes'));
app.use('/api/v1',      require('./routes/reportRoutes'));
app.use('/api/v1',      require('./routes/auditLogRoutes'));
app.use('/api/v1',      require('./routes/notificationRoutes'));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Running in ${NODE_ENV} mode on port ${PORT}`);
});
