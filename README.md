# StayFinder

A full-stack web application for listing and booking properties, similar to Airbnb.

## Live Link (https://stayfinder-1-zi3a.onrender.com/)

## Tech Stack

- Frontend: React with Tailwind
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT

## Project Structure

```
StayFinder/
├── backend/         # Express backend
├── frontend/        # React frontend
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env file with the following variables:

   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Features

- User authentication (register/login)
- Property listings with search
- Property details with booking calendar
- Host dashboard for managing listings
- Responsive design with Tailwind

## Development

- Backend API runs on http://localhost:5000
- Frontend development server runs on http://localhost:5173
