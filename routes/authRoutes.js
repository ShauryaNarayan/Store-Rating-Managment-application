// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database.js');
const { JWT_SECRET } = require('../middleware/authMiddleware.js');

const router = express.Router();

// --- REGISTER (Sign Up) ---
router.post('/signup', (req, res) => {
    const { name, email, password, address } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    // 2. Hash Password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // 3. Insert into DB (Role is always 'user' for public signup)
    const sql = `INSERT INTO Users (name, email, password, address, role) VALUES (?,?,?,?,?)`;
    const params = [name, email, hash, address, 'user'];

    db.run(sql, params, function (err) {
        if (err) {
            // Check for unique email constraint
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ error: "Email already registered." });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            message: "User registered successfully.", 
            userId: this.lastID 
        });
    });
});

// --- LOGIN ---
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM Users WHERE email = ?`;

    db.get(sql, [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        // 1. Check if user exists
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // 2. Check Password
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ error: "Invalid password." });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name }, // Payload
            JWT_SECRET,
            { expiresIn: '24h' } // Token Valid for 24 hours
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

module.exports = router;