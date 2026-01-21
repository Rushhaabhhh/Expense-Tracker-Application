# Personal Finance Tracker

A production-ready expense tracking application for mobile devices, built with React Native and Node.js/Express.

## Features

- User authentication with JWT tokens
- CRUD operations for expenses
- Category-based expense categorization
- Monthly budget tracking and management
- Monthly spending summaries and analytics
- Real-time expense listing and filtering
- Protected API endpoints with middleware

## Tech Stack

### Frontend
- React Native (TypeScript)
- React Navigation
- Axios (HTTP client)
- AsyncStorage (local persistence)
- React Context API (state management)

### Backend
- Node.js + Express.js
- MongoDB + Mongoose (ODM)
- JWT (authentication)
- bcrypt (password hashing)
- CORS (cross-origin support)

## Project Structure

```
expense-tracker/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── expenseController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── expenses.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── navigation/
    │   ├── screens/
    │   ├── services/
    │   └── types/
    ├── App.tsx
    ├── package.json
    └── metro.config.js
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- React Native CLI
- Android Studio or Xcode

## Setup Instructions

### Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. Start MongoDB service and server:
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5000`.

### Frontend

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API base URL in `src/services/api.ts`:
   ```typescript
   // Android emulator
   const API_URL = 'http://10.0.2.2:5000/api';
   
   // iOS simulator / real device (use machine IP)
   const API_URL = 'http://localhost:5000/api';
   ```

4. Run the application:
   ```bash
   # Android
   npx react-native run-android
   
   # iOS (macOS only)
   npx react-native run-ios
   ```

## API Endpoints

### Authentication
```
POST  /api/auth/signup      # Create account
POST  /api/auth/login       # User login
GET   /api/auth/profile     # Get profile (protected)
PUT   /api/auth/budget      # Update budget (protected)
```

### Expenses
```
POST  /api/expenses         # Create expense (protected)
GET   /api/expenses         # List expenses (protected)
GET   /api/expenses/summary # Monthly summary (protected)
GET   /api/expenses/:id     # Single expense (protected)
PUT   /api/expenses/:id     # Update expense (protected)
DELETE /api/expenses/:id    # Delete expense (protected)
```

## Testing

### Backend API Testing (Postman/cURL)

1. **Health check**:
   ```bash
   curl http://localhost:5000/health
   ```

2. **User signup**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123","name":"Test User","monthlyBudget":5000}'
   ```

3. **Create expense** (use token from login):
   ```bash
   curl -X POST http://localhost:5000/api/expenses \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount":250,"category":"Food","note":"Lunch"}'
   ```

## Environment Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/expense-tracker` |
| `JWT_SECRET` | JWT signing key | `your-secure-secret-key` |
| `NODE_ENV` | Environment mode | `development` |