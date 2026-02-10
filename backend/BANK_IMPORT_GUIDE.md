# Bank Statement CSV Import - Guide

## Supported CSV Formats

The bank import feature accepts CSV files with the following column names (case-insensitive):

### Date Column (required)
One of: `date`, `transaction date`, `posting date`, `txn date`, `value date`

### Description Column (required)
One of: `description`, `narration`, `details`, `particulars`, `remarks`, `merchant`

### Amount Columns (one required)

**Option 1: Separate Debit/Credit columns**
- Debit: `debit`, `withdrawal`, `paid out`, `dr`, `debit amount`, `amount (dr)`, `withdrawal (dr)`
- Credit: `credit`, `deposit`, `paid in`, `cr`, `credit amount`, `amount (cr)`

**Option 2: Single Amount column with Type**
- Amount: `amount`, `transaction amount`, `amt`, `amount (inr)`, `transaction amount (inr)`
- Type: `type`, `transaction type`, `dr/cr`, `debit/credit`, `txn type` (should contain "debit"/"dr" or "credit"/"cr")

## Sample CSV Files

### Format 1: Separate Debit/Credit Columns
```csv
Date,Description,Debit,Credit
2026-02-01,Amazon Shopping,2500,
2026-02-03,Uber Ride,450,
2026-02-05,Salary,,50000
2026-02-06,Restaurant,1200,
```

### Format 2: Single Amount Column with Type
```csv
Transaction Date,Narration,Amount,Type
01/02/2026,Amazon Shopping,2500,Debit
03/02/2026,Uber Ride,450,Dr
05/02/2026,Salary,50000,Credit
06/02/2026,Restaurant,1200,Debit
```

### Format 3: Amount with Dr/Cr notation
```csv
Date,Particulars,Amount (INR),Dr/Cr
2026-02-01,Amazon Shopping,2500.00,Dr
2026-02-03,Uber Ride to Airport,450.00,Dr
2026-02-05,Monthly Salary,50000.00,Cr
2026-02-06,Restaurant Bill at Taj,1200.00,Dr
```

## Category Auto-Detection

The system automatically categorizes transactions based on description keywords:

- **Travel**: uber, ola, taxi, flight
- **Food**: restaurant, cafe, food, pizza
- **Entertainment**: movie, netflix, cinema
- **Shopping**: amazon, flipkart, store
- **Bills**: bill, electric, water, rent
- **Education**: school, college, course
- **Health**: hospital, pharmacy, medical
- **Misc**: (default for everything else)

You can change categories in the preview screen before importing.

## Duplicate Detection

Duplicates are detected using a hash of:
- Amount
- Date
- Description

Transactions with the same amount, date, and description will be marked as duplicates and can be skipped during import.

## Troubleshooting

### "CSV file is required"
- Make sure you selected a valid file
- Check that the file has .csv extension
- Try re-exporting from your bank

### "CSV file is empty or invalid"
- Open the CSV in a text editor to verify it has content
- Make sure the CSV has headers in the first row
- Check that values are properly comma-separated

### "No valid debit transactions found"
- Verify your CSV has columns matching the supported names (see above)
- Check that debit amounts are in the correct column
- Make sure dates are in a recognizable format (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
- The error response will show why rows were skipped

### "File too large (max 2MB)"
- Split your CSV into smaller files
- Remove unnecessary columns before uploading

### 400 Bad Request
- Check backend console logs for detailed error messages
- Verify authentication token is valid
- Make sure the backend server is running
- Check CORS configuration if uploading from a different domain

## Testing

Use the included `sample-bank-statement.csv` file to test the import feature:

```bash
# From backend directory
# Copy sample file to desktop or downloads
cp sample-bank-statement.csv ~/Desktop/
```

Then upload this file in the app to verify the import flow works.

## API Endpoints

### POST /api/bank/import/parse
Upload CSV and get preview of transactions.

**Request:**
- Content-Type: multipart/form-data
- Field name: `file`
- Authorization: Bearer token required

**Response:**
```json
{
  "transactions": [
    {
      "clientExpenseId": "hash...",
      "amount": 2500,
      "date": "2026-02-01T00:00:00.000Z",
      "description": "Amazon Shopping",
      "category": "Shopping",
      "source": "BANK_CSV",
      "isDuplicate": false
    }
  ],
  "skipped": [
    { "row": 3, "reason": "Not a debit transaction" }
  ],
  "summary": {
    "totalRows": 5,
    "validDebits": 4,
    "duplicates": 0,
    "skipped": 1
  }
}
```

### POST /api/bank/import/confirm
Confirm and save selected transactions.

**Request:**
```json
{
  "transactions": [
    {
      "clientExpenseId": "hash...",
      "amount": 2500,
      "date": "2026-02-01T00:00:00.000Z",
      "description": "Amazon Shopping",
      "category": "Shopping",
      "source": "BANK_CSV"
    }
  ]
}
```

**Response:**
```json
{
  "importedCount": 3,
  "skippedDuplicates": 1,
  "totalSelected": 4
}
```

## Notes

- Only debit transactions (expenses) are imported
- Credit transactions (income/deposits) are automatically skipped
- Each alert is sent only once per month
- All imported expenses appear in the normal expense list
- You can edit/delete imported expenses like any other expense
