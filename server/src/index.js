const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { PORT, CLIENT_URL, NODE_ENV } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

connectDB().then(() => {
  if (NODE_ENV !== 'test') {
    require('./jobs/cronJobs').startCronJobs();
  }
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/userRoutes'));
app.use('/api/v1', require('./routes/adminRoutes'));
app.use('/api/v1', require('./routes/settingsRoutes'));
app.use('/api/v1', require('./routes/mealRoutes'));
app.use('/api/v1', require('./routes/menuRoutes'));
app.use('/api/v1', require('./routes/chefRoutes'));
app.use('/api/v1', require('./routes/purchaseRoutes'));
app.use('/api/v1', require('./routes/otherCostRoutes'));
app.use('/api/v1', require('./routes/depositRoutes'));
app.use('/api/v1', require('./routes/billingRoutes'));
app.use('/api/v1', require('./routes/stockRoutes'));
app.use('/api/v1', require('./routes/dashboardRoutes'));
app.use('/api/v1', require('./routes/reportRoutes'));
app.use('/api/v1', require('./routes/auditLogRoutes'));
app.use('/api/v1', require('./routes/notificationRoutes'));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});
