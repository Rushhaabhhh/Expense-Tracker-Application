const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Chat endpoint
router.post(
  '/',
  [
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 500 })
      .withMessage('Message must be less than 500 characters')
  ],
  chatController.chat
);

module.exports = router;
