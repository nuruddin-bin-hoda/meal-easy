const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { setMenu, getMenuForDate, getTomorrowMenu } = require('../controllers/menuController');

const router = Router();

router.post(
  '/menus',
  authenticate,
  authorize(['admin', 'superadmin']),
  [
    body('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('date must be a valid YYYY-MM-DD date.'),
    body('mealType').trim().notEmpty().withMessage('mealType is required.'),
    body('items').isArray().withMessage('items must be an array.'),
    body('items.*').trim().notEmpty().withMessage('Each item must be a non-empty string.'),
  ],
  validate,
  setMenu,
);

router.get('/menus/tomorrow', authenticate, getTomorrowMenu);

router.get('/menus/:date', authenticate, getMenuForDate);

module.exports = router;
