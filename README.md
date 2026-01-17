RateMyShop - Backend Application

This is the backend server for the RateMyShop application.

PREREQUISITES
Node.js (v14 or higher) must be installed on your computer.

SETUP INSTRUCTIONS

1. Open your terminal or command prompt.
2. Navigate to the backend folder:
   cd backend
3. Install the required libraries:
   npm install
4. Start the server:
   npx nodemon server.js

The server will start running on port 5000.
The database file (db.sqlite) is created automatically when you run the server.

DEFAULT LOGIN CREDENTIALS

Role: System Admin
Email: admin@roxiler.com
Password: Admin@123

Role: Store Owner
Email: owner@apple.com
Password: Owner@123

Role: Normal User
Email: alice@gmail.com
Password: Alice@123

API ENDPOINTS

Auth Routes:
POST /api/auth/signup - Register a new user
POST /api/auth/login - Login to the system
PATCH /api/auth/update-password - Change password

Admin Routes:
GET /api/admin/dashboard - View total stats
POST /api/admin/users - Create a new user
POST /api/admin/stores - Create a new store

User Routes:
GET /api/user/stores - View and search stores
POST /api/user/rating - Submit a rating

Owner Routes:
GET /api/owner/dashboard - View store stats
