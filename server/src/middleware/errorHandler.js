const { NODE_ENV } = require('../config/env');

const errorHandler = (err, _req, res, _next) => {
  if (NODE_ENV === 'development') console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
};

module.exports = errorHandler;
