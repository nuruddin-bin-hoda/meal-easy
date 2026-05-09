const { Router } = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { recordDeposit, listDeposits, getUserDeposits } = require('../controllers/depositController');

const router = Router();

router.post(
  '/deposits',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    body('userId').isMongoId().withMessage('userId must be a valid user ID.'),
    body('amount').isFloat({ min: 0.01 }).withMessage('amount must be greater than zero.'),
    body('date').isISO8601().withMessage('date must be a valid ISO 8601 date.'),
    body('note').optional().trim().notEmpty().withMessage('note must not be empty if provided.'),
  ],
  validate,
  recordDeposit,
);

router.get(
  '/deposits',
  authenticate,
  authorize(['admin', 'superadmin']),
  listDeposits,
);

router.get(
  '/deposits/user/:userId',
  authenticate,
  [param('userId').isMongoId().withMessage('userId must be a valid MongoDB ObjectId.')],
  validate,
  getUserDeposits,
);

module.exports = router;
