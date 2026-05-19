const { Router } = require('express');
const { body } = require('express-validator');
const upload = require('../config/multer');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { register, login, logout, getMe } = require('../controllers/authController');

const router = Router();

router.post(
  '/register',
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('phone').trim().notEmpty().withMessage('Phone is required.'),
    body('roomNumber').trim().notEmpty().withMessage('Room number is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register,
);

router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('Phone is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login,
);

router.post('/logout', logout);

router.get('/me', authenticate, getMe);

module.exports = router;
