const Groq = require('groq-sdk');
const Expense = require('../models/Expense');
const User = require('../models/User');

// Initialize Groq client with validation
let groq;
try {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
  console.log('✓ Groq client initialized successfully');
} catch (error) {
  console.error('✗ Failed to initialize Groq client:', error.message);
  groq = null;
}

const INTENTS = {
  MONTHLY_TOTAL: ['how much', 'spent', 'this month', 'total', 'spending'],
  CATEGORY_SPEND: ['category', 'spent on', 'spending on', 'category breakdown', 'food', 'travel', 'shopping'],
  BUDGET_STATUS: ['budget', 'remaining', 'left', 'within budget', 'over budget'],
  RECENT_EXPENSES: ['last expenses', 'recent', 'recent expenses', 'latest'],
  AVERAGE_SPEND: ['average', 'per day', 'daily', 'spending average'],
  HIGH_SPEND: ['most spent', 'highest', 'expensive', ' most', 'biggest expense'],
  GENERAL: ['what', 'how', 'can you', 'tell me', 'help']
};

/**
 * Detect user intent based on keywords
 */
const detectIntent = (message) => {
  const text = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return intent;
    }
  }
  
  return 'GENERAL';
};

/**
 * Fetch monthly summary for the current month
 */
const getMonthlySummary = async (userId) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  return { expenses, totalSpent, startDate, endDate };
};

/**
 * Fetch expenses by category
 */
const getExpensesByCategory = async (userId) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });

  const categoryBreakdown = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = 0;
    acc[exp.category] += exp.amount;
    return acc;
  }, {});

  return categoryBreakdown;
};

/**
 * Fetch recent expenses
 */
const getRecentExpenses = async (userId, limit = 5) => {
  return await Expense.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .select('amount category date note');
};

/**
 * Build context object from expense data
 */
const buildContext = async (userId, intent) => {
  try {
    const user = await User.findById(userId).select('email name monthlyBudget');
    if (!user) return null;

    const monthlySummary = await getMonthlySummary(userId);
    const categoryBreakdown = await getExpensesByCategory(userId);
    const recentExpenses = await getRecentExpenses(userId, 5);

    const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const budgetRemaining = user.monthlyBudget - monthlySummary.totalSpent;
    const budgetUtilization = user.monthlyBudget > 0 ? ((monthlySummary.totalSpent / user.monthlyBudget) * 100).toFixed(1) : 0;

    // Format recent expenses
    const recentFormatted = recentExpenses
      .map(exp => `₹${exp.amount} on ${exp.category}${exp.note ? ` (${exp.note})` : ''} on ${new Date(exp.date).toLocaleDateString()}`)
      .join('\n  • ');

    // Format category breakdown
    const categoriesFormatted = Object.entries(categoryBreakdown)
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`)
      .join(', ');

    return {
      userName: user.name,
      monthName,
      monthlyBudget: user.monthlyBudget,
      totalSpent: monthlySummary.totalSpent.toFixed(2),
      budgetRemaining: Math.max(0, budgetRemaining).toFixed(2),
      budgetUtilization,
      isOverBudget: budgetRemaining < 0,
      categoryBreakdown: categoriesFormatted || 'No expenses yet',
      recentExpenses: recentFormatted || 'No recent expenses',
      expenseCount: monthlySummary.expenses.length,
      highestCategory: Object.entries(categoryBreakdown).length > 0 
        ? Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]
        : null
    };
  } catch (error) {
    console.error('Error building context:', error);
    return null;
  }
};

/**
 * Generate LLM prompt based on intent and context
 */
const generatePrompt = (userMessage, context, intent) => {
  if (!context) {
    return `User asked: "${userMessage}"\n\nRespond briefly that you need data to answer this question.`;
  }

  const baseContext = `
You are a friendly expense tracker assistant. Respond in 1-2 sentences, using data below.
Keep responses conversational and helpful.

User: ${context.userName}
Current Month: ${context.monthName}

Budget Summary:
- Monthly Budget: ₹${context.monthlyBudget}
- Total Spent: ₹${context.totalSpent}
- Remaining: ₹${context.budgetRemaining}
- Budget Used: ${context.budgetUtilization}%
${context.isOverBudget ? '⚠️ OVER BUDGET' : '✓ Within Budget'}

Expenses by Category:
${context.categoryBreakdown}

Recent Expenses:
• ${context.recentExpenses}

${context.highestCategory ? `Highest Spending Category: ${context.highestCategory[0]} (₹${context.highestCategory[1].toFixed(2)})` : ''}
`;

  let intentPrompt = '';
  
  switch (intent) {
    case 'MONTHLY_TOTAL':
      intentPrompt = `User asked: "${userMessage}"\n\nAnswer how much they've spent this month as a percentage of their budget.`;
      break;
    case 'CATEGORY_SPEND':
      intentPrompt = `User asked: "${userMessage}"\n\nRespond with their spending by category.`;
      break;
    case 'BUDGET_STATUS':
      intentPrompt = `User asked: "${userMessage}"\n\nTell them their budget status (remaining amount and percentage used).`;
      break;
    case 'RECENT_EXPENSES':
      intentPrompt = `User asked: "${userMessage}"\n\nSummarize their recent 5 expenses.`;
      break;
    case 'AVERAGE_SPEND':
      const avgDaily = (parseFloat(context.totalSpent) / new Date().getDate()).toFixed(2);
      intentPrompt = `User asked: "${userMessage}"\n\nTheir average daily spending is ₹${avgDaily}. Comment on this in context of their budget.`;
      break;
    case 'HIGH_SPEND':
      intentPrompt = `User asked: "${userMessage}"\n\nTell them their highest spending category.`;
      break;
    default:
      intentPrompt = `User asked: "${userMessage}"\n\nAnswer helpfully using their expense data.`;
  }

  return baseContext + '\n' + intentPrompt;
};

/**
 * Call Groq API to generate response
 */
const generateResponse = async (prompt) => {
  try {
    if (!groq) {
      throw new Error('Groq client not initialized. Please set GROQ_API_KEY environment variable.');
    }

    console.log('Calling Groq API...');
    
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // Free model
      max_tokens: 256,
      temperature: 0.7
    });

    const reply = message.choices[0]?.message?.content || 'Unable to generate response';
    console.log('Groq response received:', reply.substring(0, 100));
    return reply.trim();
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};

/**
 * Main chat handler
 */
const chat = async (userId, userMessage) => {
  try {
    if (!userMessage || userMessage.trim().length === 0) {
      return 'Please ask me something about your expenses!';
    }

    // Detect intent
    const intent = detectIntent(userMessage);
    console.log(`Detected intent: ${intent}`);

    // Build context from database
    const context = await buildContext(userId, intent);
    
    if (!context) {
      return 'I couldn\'t access your expense data. Please try again.';
    }

    // Generate prompt
    const prompt = generatePrompt(userMessage, context, intent);

    // Get LLM response
    const response = await generateResponse(prompt);

    return response;
  } catch (error) {
    console.error('Chat error:', error);
    
    // Fallback response
    if (error.message?.includes('API key')) {
      return 'The chatbot service is not configured. Please add your Groq API key.';
    }
    
    return 'I encountered an issue processing your question. Please try again.';
  }
};

module.exports = {
  chat,
  detectIntent
};
