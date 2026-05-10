const { Router } = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  listStock, createStock, updateStockQuantity, updateStockSettings, archiveStock,
} = require('../controllers/stockController');

const router = Router();

const idParam = param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.');

router.get('/stock', authenticate, listStock);

router.post(
  '/stock',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    body('itemName').trim().notEmpty().withMessage('itemName is required.'),
    body('quantity').isFloat({ min: 0 }).withMessage('quantity must be a non-negative number.'),
    body('unit').trim().notEmpty().withMessage('unit is required.'),
    body('lowThreshold').isFloat({ min: 0 }).withMessage('lowThreshold must be a non-negative number.'),
  ],
  validate,
  createStock,
);

router.patch(
  '/stock/:id',
  authenticate,
  authorize(['admin', 'superadmin', 'chef']),
  [
    idParam,
    body('quantity').isFloat({ min: 0 }).withMessage('quantity must be a non-negative number.'),
  ],
  validate,
  updateStockQuantity,
);

router.patch(
  '/stock/:id/settings',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    idParam,
    body('itemName').optional().trim().notEmpty().withMessage('itemName must not be empty.'),
    body('lowThreshold').optional().isFloat({ min: 0 }).withMessage('lowThreshold must be a non-negative number.'),
  ],
  validate,
  updateStockSettings,
);

router.delete(
  '/stock/:id',
  authenticate,
  authorize(['admin', 'superadmin']),
  [idParam],
  validate,
  archiveStock,
);

module.exports = router;
