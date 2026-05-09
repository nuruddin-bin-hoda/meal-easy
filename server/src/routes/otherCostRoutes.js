const { Router } = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createOtherCost, listOtherCosts, deleteOtherCost } = require('../controllers/otherCostController');

const router = Router();

router.post(
  '/costs',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    body('billingMonth')
      .matches(/^\d{4}-\d{2}$/)
      .withMessage('billingMonth must be in YYYY-MM format.'),
    body('description').trim().notEmpty().withMessage('description is required.'),
    body('amount').isFloat({ min: 0 }).withMessage('amount must be a non-negative number.'),
  ],
  validate,
  createOtherCost,
);

router.get(
  '/costs',
  authenticate,
  authorize(['admin', 'superadmin']),
  listOtherCosts,
);

router.delete(
  '/costs/:id',
  authenticate,
  authorize(['admin', 'superadmin']),
  [param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.')],
  validate,
  deleteOtherCost,
);

module.exports = router;
