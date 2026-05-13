const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { getTodayToggles, setToggle, getMealHistory, getMealCount } = require('../controllers/mealController');

const router = Router();

router.get('/meals/today',    authenticate, getTodayToggles);
router.get('/meals/tomorrow', authenticate, getTodayToggles); // backward-compat alias

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
