const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const Expense = require('../models/Expense');

const MAX_ROWS = 2000;
const SOURCE_BANK_CSV = 'BANK_CSV';

const AMOUNT_KEYS = [
  'amount',
  'transaction amount',
  'amt',
  'amount (inr)',
  'transaction amount (inr)'
];
const DEBIT_KEYS = [
  'debit',
  'withdrawal',
  'paid out',
  'dr',
  'debit amount',
  'amount (dr)',
  'withdrawal (dr)'
];
const CREDIT_KEYS = [
  'credit',
  'deposit',
  'paid in',
  'cr',
  'credit amount',
  'amount (cr)'
];
const TYPE_KEYS = [
  'type',
  'transaction type',
  'dr/cr',
  'debit/credit',
  'txn type'
];
const DATE_KEYS = [
  'date',
  'transaction date',
  'posting date',
  'txn date',
  'value date'
];
const DESCRIPTION_KEYS = [
  'description',
  'narration',
  'details',
  'particulars',
  'remarks',
  'merchant'
];

const toKey = (value) => String(value || '').trim().toLowerCase();

const getValue = (row, keys) => {
  const normalized = {};
  Object.keys(row || {}).forEach((key) => {
    normalized[toKey(key)] = row[key];
  });

  for (const key of keys) {
    const normalizedKey = toKey(key);
    if (normalizedKey in normalized && normalized[normalizedKey] !== undefined) {
      return normalized[normalizedKey];
    }
  }
  return null;
};

const parseAmount = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return null;
  const cleaned = String(rawValue)
    .replace(/[,₹$]/g, '')
    .replace(/\s+/g, '')
    .replace(/[()]/g, (match) => (match === '(' ? '-' : ''));
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const parseDate = (rawValue) => {
  if (!rawValue) return null;
  const value = String(rawValue).trim();

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const slash = value.includes('/') ? value.split('/') : null;
  if (slash && slash.length === 3) {
    const [part1, part2, part3] = slash.map((part) => part.trim());
    const dayFirst = Number(part1) > 12;
    const day = dayFirst ? Number(part1) : Number(part2);
    const month = dayFirst ? Number(part2) : Number(part1);
    const year = Number(part3);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const dash = value.includes('-') ? value.split('-') : null;
  if (dash && dash.length === 3) {
    const [part1, part2, part3] = dash.map((part) => part.trim());
    const yearFirst = part1.length === 4;
    const year = yearFirst ? Number(part1) : Number(part3);
    const month = yearFirst ? Number(part2) : Number(part2);
    const day = yearFirst ? Number(part3) : Number(part1);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const detectCategory = (description) => {
  const text = (description || '').toLowerCase();
  if (text.includes('uber') || text.includes('ola') || text.includes('taxi') || text.includes('flight')) return 'Travel';
  if (text.includes('restaurant') || text.includes('cafe') || text.includes('food') || text.includes('pizza')) return 'Food';
  if (text.includes('movie') || text.includes('netflix') || text.includes('cinema')) return 'Entertainment';
  if (text.includes('amazon') || text.includes('flipkart') || text.includes('store')) return 'Shopping';
  if (text.includes('bill') || text.includes('electric') || text.includes('water') || text.includes('rent')) return 'Bills';
  if (text.includes('school') || text.includes('college') || text.includes('course')) return 'Education';
  if (text.includes('hospital') || text.includes('pharmacy') || text.includes('medical')) return 'Health';
  return 'Misc';
};

const buildHash = (amount, date, description) => {
  const normalizedDescription = String(description || '').trim().toLowerCase();
  const dateKey = new Date(date).toISOString().slice(0, 10);
  const amountKey = Number(amount).toFixed(2);
  const raw = `${amountKey}|${dateKey}|${normalizedDescription}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
};

const normalizeRow = (row) => {
  const debitValue = getValue(row, DEBIT_KEYS);
  const creditValue = getValue(row, CREDIT_KEYS);
  const amountValue = getValue(row, AMOUNT_KEYS);
  const typeValue = getValue(row, TYPE_KEYS);

  let amount = null;
  let isDebit = false;

  if (debitValue !== null && debitValue !== undefined && debitValue !== '') {
    amount = parseAmount(debitValue);
    isDebit = true;
  } else if (amountValue !== null && amountValue !== undefined && amountValue !== '') {
    const parsedAmount = parseAmount(amountValue);
    if (parsedAmount !== null) {
      if (parsedAmount < 0) {
        amount = Math.abs(parsedAmount);
        isDebit = true;
      } else {
        const typeText = String(typeValue || '').toLowerCase();
        if (typeText.includes('credit') || typeText.includes('cr')) {
          isDebit = false;
        } else if (typeText.includes('debit') || typeText.includes('dr')) {
          isDebit = true;
          amount = parsedAmount;
        } else if (creditValue) {
          isDebit = false;
        } else {
          // Default to debit when unsure to allow user to review in preview
          isDebit = true;
          amount = parsedAmount;
        }
      }
    }
  }

  if (!isDebit || !amount || amount <= 0) {
    return { error: 'Not a debit transaction' };
  }

  const rawDate = getValue(row, DATE_KEYS);
  const parsedDate = parseDate(rawDate);
  if (!parsedDate) {
    return { error: 'Invalid date' };
  }

  const description = String(getValue(row, DESCRIPTION_KEYS) || '').trim();
  if (!description) {
    return { error: 'Missing description' };
  }

  const category = detectCategory(description);
  const importHash = buildHash(amount, parsedDate, description);

  return {
    amount,
    date: parsedDate,
    description,
    category,
    source: SOURCE_BANK_CSV,
    clientExpenseId: importHash,
    importHash
  };
};

exports.parseBankStatement = async (req, res) => {
  try {
    console.log('Parse bank statement request received');
    console.log('Has file:', !!req.file);
    console.log('File details:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    if (!req.file || !req.file.buffer) {
      console.log('ERROR: No file or buffer in request');
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    console.log('CSV text length:', csvText.length);
    console.log('CSV first 200 chars:', csvText.substring(0, 200));

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log('Parsed records count:', records.length);

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid' });
    }

    if (records.length > MAX_ROWS) {
      return res.status(400).json({ message: `CSV has too many rows (max ${MAX_ROWS})` });
    }

    const transactions = [];
    const skipped = [];

    records.forEach((row, index) => {
      const normalized = normalizeRow(row);
      if (normalized.error) {
        skipped.push({ row: index + 1, reason: normalized.error });
        return;
      }
      transactions.push(normalized);
    });

    console.log('Valid transactions:', transactions.length);
    console.log('Skipped transactions:', skipped.length);

    if (transactions.length === 0) {
      return res.status(400).json({ 
        message: 'No valid debit transactions found',
        details: skipped.slice(0, 5) // Show first 5 reasons
      });
    }

    const hashes = transactions.map((txn) => txn.importHash);
    const existing = await Expense.find({
      userId: req.user._id,
      importHash: { $in: hashes }
    }).select('importHash');

    const existingHashes = new Set(existing.map((exp) => exp.importHash));
    const preview = transactions.map((txn) => ({
      ...txn,
      isDuplicate: existingHashes.has(txn.importHash)
    }));

    res.json({
      transactions: preview,
      skipped,
      summary: {
        totalRows: records.length,
        validDebits: preview.length,
        duplicates: preview.filter((txn) => txn.isDuplicate).length,
        skipped: skipped.length
      }
    });
  } catch (error) {
    console.error('Parse bank statement error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error parsing bank statement',
      error: error.message 
    });
  }
};

exports.confirmBankImport = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: 'No transactions provided' });
    }

    const normalized = transactions.map((txn) => {
      const amount = Number(txn.amount);
      const date = new Date(txn.date);
      const description = String(txn.description || '').trim();
      const category = txn.category || 'Misc';
      const source = txn.source || SOURCE_BANK_CSV;

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return { error: 'Invalid amount' };
      }
      if (Number.isNaN(date.getTime())) {
        return { error: 'Invalid date' };
      }
      if (!description) {
        return { error: 'Missing description' };
      }

      const importHash = buildHash(amount, date, description);
      return {
        amount,
        date,
        description,
        category,
        source,
        clientExpenseId: txn.clientExpenseId || importHash,
        importHash
      };
    });

    const invalid = normalized.find((txn) => txn.error);
    if (invalid) {
      return res.status(400).json({ message: invalid.error });
    }

    const hashes = normalized.map((txn) => txn.importHash);
    const existing = await Expense.find({
      userId: req.user._id,
      importHash: { $in: hashes }
    }).select('importHash');

    const existingHashes = new Set(existing.map((exp) => exp.importHash));

    const newExpenses = normalized
      .filter((txn) => !existingHashes.has(txn.importHash))
      .map((txn) => ({
        userId: req.user._id,
        amount: txn.amount,
        category: txn.category,
        note: txn.description,
        date: txn.date,
        source: txn.source,
        clientExpenseId: txn.clientExpenseId,
        importHash: txn.importHash
      }));

    if (newExpenses.length > 0) {
      await Expense.insertMany(newExpenses, { ordered: false });
    }

    const skippedDuplicates = normalized.length - newExpenses.length;
    if (skippedDuplicates > 0) {
      console.log(`Skipped ${skippedDuplicates} duplicate bank transactions for user ${req.user._id}`);
    }

    res.json({
      importedCount: newExpenses.length,
      skippedDuplicates,
      totalSelected: normalized.length
    });
  } catch (error) {
    console.error('Confirm bank import error:', error);
    res.status(500).json({ message: 'Server error importing transactions' });
  }
};
