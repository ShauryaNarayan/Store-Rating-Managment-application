const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database.js');
const { JWT_SECRET, verifyToken } = require('../middleware/authMiddleware.js'); // Added verifyToken

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

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ error: "Invalid password." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
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

// --- UPDATE PASSWORD (New Feature) ---
router.patch('/update-password', verifyToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword.match(/^(?=.*[A-Z])(?=.*[!@#$&*]).{8,16}$/)) {
        return res.status(400).json({ error: "New password must be 8-16 chars, 1 Upper, 1 Special" });
    }

    try {
        db.get("SELECT password FROM Users WHERE id = ?", [userId], (err, row) => {
            if (err || !row) return res.status(404).json({ error: "User not found" });

            const match = bcrypt.compareSync(oldPassword, row.password);
            if (!match) return res.status(400).json({ error: "Incorrect old password" });

            const hashedNew = bcrypt.hashSync(newPassword, 10);
            db.run("UPDATE Users SET password = ? WHERE id = ?", [hashedNew, userId], (err) => {
                if (err) return res.status(500).json({ error: "Update failed" });
                res.json({ message: "Password updated successfully!" });
            });
        });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;