const { Router } = require('express');
const { body } = require('express-validator');
const upload = require('../config/multer');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createChef, listChefs, getChef, updateChef,
  recordSalary, addBonus, getSalaryHistory,
} = require('../controllers/chefController');

const router = Router();

const adminOnly = [authenticate, authorize(['admin', 'superadmin'])];

router.post(
  '/chefs',
  ...adminOnly,
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('name is required.'),
    body('phone').trim().notEmpty().withMessage('phone is required.'),
    body('loginUsername').trim().notEmpty().withMessage('loginUsername is required.'),
    body('loginPassword').isLength({ min: 6 }).withMessage('loginPassword must be at least 6 characters.'),
    body('salaryAmount').isFloat({ min: 0 }).withMessage('salaryAmount must be a non-negative number.'),
    body('joinDate').isDate({ format: 'YYYY-MM-DD' }).withMessage('joinDate must be a valid date.'),
  ],
  validate,
  createChef,
);

router.get('/chefs', ...adminOnly, listChefs);

router.get('/chefs/:id', ...adminOnly, getChef);

router.patch(
  '/chefs/:id',
  ...adminOnly,
  upload.single('photo'),
  [
    body('name').optional().trim().notEmpty().withMessage('name must not be empty.'),
    body('phone').optional().trim().notEmpty().withMessage('phone must not be empty.'),
    body('salaryAmount').optional().isFloat({ min: 0 }).withMessage('salaryAmount must be a non-negative number.'),
    body('joinDate').optional().isDate({ format: 'YYYY-MM-DD' }).withMessage('joinDate must be a valid date.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
  ],
  validate,
  updateChef,
);

router.post(
  '/chefs/:id/salary',
  ...adminOnly,
  [
    body('billingMonth').matches(/^\d{4}-\d{2}$/).withMessage('billingMonth must be YYYY-MM format.'),
    body('salaryAmount').isFloat({ min: 0 }).withMessage('salaryAmount must be a non-negative number.'),
    body('paidStatus').isIn(['paid', 'unpaid']).withMessage('paidStatus must be paid or unpaid.'),
  ],
  validate,
  recordSalary,
);

router.post(
  '/chefs/:id/bonus',
  ...adminOnly,
  [
    body('amount').isFloat({ min: 0 }).withMessage('amount must be a non-negative number.'),
    body('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('date must be a valid date.'),
    body('reason').trim().notEmpty().withMessage('reason is required.'),
  ],
  validate,
  addBonus,
);

router.get('/chefs/:id/salary', ...adminOnly, getSalaryHistory);

module.exports = router;
