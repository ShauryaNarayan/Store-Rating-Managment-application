// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./database.js');

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');   // <--- Added this (Missing in yours)
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Mount Routes ---
app.use('/api/auth', authRoutes);   // <--- Added this (Critical for Login/Signup)
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/owner', ownerRoutes);

// Basic Test Route
app.get('/', (req, res) => {
    res.json({ message: "Roxiler Backend is running!" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});