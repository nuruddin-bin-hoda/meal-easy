const { Router } = require('express');
const { param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { previewBilling, submitBilling, getBilling, getPredictedRate } = require('../controllers/billingController');

const router = Router();

const monthParam = param('month')
  .matches(/^\d{4}-\d{2}$/)
  .withMessage('month must be in YYYY-MM format.');

router.get(
  '/billing/:month/preview',
  authenticate,
  authorize(['admin', 'superadmin']),
  [monthParam],
  validate,
  previewBilling,
);

router.post(
  '/billing/:month/submit',
  authenticate,
  authorize(['admin', 'superadmin']),
  [monthParam],
  validate,
  submitBilling,
);

// GET /billing/:month/rate must be registered before /billing/:month
// to avoid Express matching 'rate' as the :month param on the broader route.
router.get(
  '/billing/:month/rate',
  authenticate,
  [monthParam],
  validate,
  getPredictedRate,
);

router.get(
  '/billing/:month',
  authenticate,
  [monthParam],
  validate,
  getBilling,
);

module.exports = router;
