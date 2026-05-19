const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const upload = require('../config/multer');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { User } = require('../models');
const { promoteUser, downgradeAdmin } = require('../controllers/adminController');

const router = Router();

router.post(
  '/admins',
  authenticate,
  authorize(['superadmin']),
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('phone').trim().notEmpty().withMessage('Phone is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, phone, password, roomNumber = '' } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);
      const photo = req.file ? req.file.filename : undefined;

      await User.create({ name, phone, roomNumber, passwordHash, photo, role: 'admin', status: 'active' });

      res.status(201).json({ message: 'Admin created' });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Phone number already registered.' });
      next(err);
    }
  },
);

router.get(
  '/admins',
  authenticate,
  authorize(['superadmin']),
  async (req, res, next) => {
    try {
      const admins = await User.find({ role: 'admin' }).select('-passwordHash').sort({ createdAt: -1 });
      res.json({ admins });
    } catch (err) {
      next(err);
    }
  },
);

router.patch('/admins/:id/promote',   authenticate, authorize(['superadmin']), promoteUser);
router.patch('/admins/:id/downgrade', authenticate, authorize(['superadmin']), downgradeAdmin);

module.exports = router;
