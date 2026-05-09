const { Router } = require('express');
const upload = require('../config/multer');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  toggleMealBlock,
} = require('../controllers/userController');

const router = Router();

const adminRoles = ['admin', 'superadmin'];

router.get('/users', authenticate, authorize(adminRoles), listUsers);
router.get('/users/:id', authenticate, getUser);
router.patch('/users/:id', authenticate, upload.single('photo'), updateUser);
router.delete('/users/:id', authenticate, deleteUser);
router.patch('/users/:id/approve', authenticate, authorize(adminRoles), approveUser);
router.patch('/users/:id/reject', authenticate, authorize(adminRoles), rejectUser);
router.patch('/users/:id/meal-block', authenticate, authorize(adminRoles), toggleMealBlock);

module.exports = router;
