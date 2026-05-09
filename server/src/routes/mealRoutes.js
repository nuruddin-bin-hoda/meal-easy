const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { getTomorrowToggles, setToggle, getMealHistory, getMealCount } = require('../controllers/mealController');

const router = Router();

router.get('/meals/tomorrow', authenticate, getTomorrowToggles);

router.post(
  '/meals/toggle',
  authenticate,
  [
    body('mealType').trim().notEmpty().withMessage('mealType is required.'),
    body('isOn').isBoolean().withMessage('isOn must be a boolean.'),
    body('guestCount').optional().isInt({ min: 0 }).withMessage('guestCount must be a non-negative integer.'),
  ],
  validate,
  setToggle,
);

router.get('/meals/history', authenticate, getMealHistory);

router.get('/meals/count', authenticate, authorize(['admin', 'superadmin']), getMealCount);

module.exports = router;
