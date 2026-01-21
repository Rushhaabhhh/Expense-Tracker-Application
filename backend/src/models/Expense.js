const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Travel', 'Entertainment', 'Shopping', 'Bills', 'Education', 'Health', 'Misc']
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
expenseSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);