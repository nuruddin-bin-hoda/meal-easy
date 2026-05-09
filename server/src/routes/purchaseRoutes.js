const { Router } = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createPurchase, listPurchases, getPurchase } = require('../controllers/purchaseController');

const router = Router();

router.post(
  '/purchases',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    body('buyerUserId').isMongoId().withMessage('buyerUserId must be a valid user ID.'),
    body('item').trim().notEmpty().withMessage('item is required.'),
    body('quantity').optional().isFloat({ min: 0 }).withMessage('quantity must be a non-negative number.'),
    body('unit').optional().trim().notEmpty().withMessage('unit must not be empty.'),
    body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number.'),
    body('date').isISO8601().withMessage('date must be a valid ISO 8601 date.'),
  ],
  validate,
  createPurchase,
);

router.get(
  '/purchases',
  authenticate,
  authorize(['admin', 'superadmin']),
  listPurchases,
);

router.get(
  '/purchases/:id',
  authenticate,
  authorize(['admin', 'superadmin']),
  [param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.')],
  validate,
  getPurchase,
);

module.exports = router;
