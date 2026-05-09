const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = Router();

router.get(
  '/settings',
  authenticate,
  authorize(['admin', 'superadmin']),
  getSettings,
);

router.patch(
  '/settings',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    body('cutoffTime')
      .optional()
      .matches(/^\d{2}:\d{2}$/)
      .withMessage('cutoffTime must be HH:MM format.'),
    body('cutoffReminderMinutes')
      .optional()
      .isInt({ min: 0 })
      .withMessage('cutoffReminderMinutes must be a non-negative integer.'),
    body('guestMealMonthlyLimit')
      .optional()
      .isInt({ min: 0 })
      .withMessage('guestMealMonthlyLimit must be a non-negative integer.'),
    body('lowBalanceThreshold')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('lowBalanceThreshold must be a non-negative number.'),
    body('mealTypes')
      .optional()
      .isArray()
      .withMessage('mealTypes must be an array.'),
    body('mealTypes.*.name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('mealTypes[].name must not be empty.'),
    body('mealTypes.*.isActive')
      .optional()
      .isBoolean()
      .withMessage('mealTypes[].isActive must be boolean.'),
    body('mealTypes.*.isAutoEnabled')
      .optional()
      .isBoolean()
      .withMessage('mealTypes[].isAutoEnabled must be boolean.'),
  ],
  validate,
  updateSettings,
);

module.exports = router;
