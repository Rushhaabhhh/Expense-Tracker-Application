const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const bankImportController = require('../controllers/bankImportController');

const router = express.Router();

// Log all requests to bank import routes
router.use((req, res, next) => {
  console.log('\n=== Bank Import Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('===========================\n');
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    // Accept any CSV-like file
    const allowedMimeTypes = [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
      'text/comma-separated-values',
      'application/octet-stream'
    ];
    
    const allowedExtensions = ['.csv', '.txt'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

router.use(authMiddleware);

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Bank import route is working', user: req.user.email });
});

// Debug endpoint to see raw request
router.post('/debug-upload', upload.single('file'), (req, res) => {
  console.log('Debug upload - Headers:', req.headers);
  console.log('Debug upload - File:', req.file);
  console.log('Debug upload - Body:', req.body);
  res.json({
    hasFile: !!req.file,
    file: req.file,
    body: req.body,
    headers: req.headers
  });
});

// Error handling wrapper for multer
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large (max 2MB)' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    // Log what we received
    console.log('After multer - Has file:', !!req.file);
    console.log('After multer - Body:', req.body);
    console.log('After multer - File details:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    
    next();
  });
};

router.post('/import/parse', handleUpload, bankImportController.parseBankStatement);

router.post('/import/confirm', bankImportController.confirmBankImport);

module.exports = router;
