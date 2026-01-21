const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, note, date } = req.body;

    const expense = new Expense({
      userId: req.user._id,
      amount,
      category,
      note: note || '',
      date: date || new Date()
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error creating expense' });
  }
};

// Get all expenses with filters
exports.getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, month, year } = req.query;
    
    const query = { userId: req.user._id };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Filter by month and year
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

// Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error fetching expense' });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { amount, category, note, date } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (amount !== undefined) expense.amount = amount;
    if (category) expense.category = category;
    if (note !== undefined) expense.note = note;
    if (date) expense.date = date;

    await expense.save();

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error updating expense' });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get all expenses for the month
    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate total
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate category-wise breakdown
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {});

    const budget = req.user.monthlyBudget || 0;
    const remaining = budget - totalSpent;
    const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

    res.json({
      month: targetMonth,
      year: targetYear,
      totalSpent,
      budget,
      remaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      categoryBreakdown,
      expenseCount: expenses.length
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
};