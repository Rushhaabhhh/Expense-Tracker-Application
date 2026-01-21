const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Signup route
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('monthlyBudget').optional().isNumeric()
  ],
  authController.signup
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  authController.login
);

// Get profile (protected)
router.get('/profile', authMiddleware, authController.getProfile);

// Update budget (protected)
router.put('/budget', authMiddleware, authController.updateBudget);

module.exports = router;