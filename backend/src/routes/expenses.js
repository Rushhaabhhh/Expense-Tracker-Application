const express = require('express');
const { body } = require('express-validator');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Create expense
router.post(
  '/',
  [
    body('amount').isFloat({ min: 0 }),
    body('category').isIn(['Food', 'Travel', 'Entertainment', 'Shopping', 'Bills', 'Education', 'Health', 'Misc']),
    body('note').optional().trim(),
    body('date').optional().isISO8601()
  ],
  expenseController.createExpense
);

// Get all expenses with filters
router.get('/', expenseController.getExpenses);

// Get monthly summary
router.get('/summary', expenseController.getMonthlySummary);

// Get single expense
router.get('/:id', expenseController.getExpenseById);

// Update expense
router.put('/:id', expenseController.updateExpense);

// Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;