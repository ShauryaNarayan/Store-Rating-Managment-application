const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// --- 1. ADMIN DASHBOARD STATS ---
router.get('/dashboard', verifyToken, checkRole(['admin']), (req, res) => {
    const stats = {};
    db.get("SELECT COUNT(*) as count FROM Users", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalUsers = row.count;
        db.get("SELECT COUNT(*) as count FROM Stores", [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalStores = row.count;
            db.get("SELECT COUNT(*) as count FROM Ratings", [], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalRatings = row.count;
                res.json(stats);
            });
        });
    });
});

// --- 2. USER MANAGEMENT ---
router.get('/users', verifyToken, checkRole(['admin']), (req, res) => {
    db.all("SELECT id, name, email, role, address FROM Users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/users', verifyToken, checkRole(['admin']), async (req, res) => {
    const { name, email, password, address, role } = req.body;
    
    if (name.length < 10 || name.length > 60) return res.status(400).json({ error: "Name must be 10-60 chars" });
    if (!password.match(/^(?=.*[A-Z])(?=.*[!@#$&*]).{8,16}$/)) return res.status(400).json({ error: "Password must be 8-16 chars, 1 Upper, 1 Special" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO Users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)`, 
            [name, email, hashedPassword, address, role], 
            function(err) {
                if (err) return res.status(400).json({ error: "Email already exists!" });
                res.json({ id: this.lastID, message: "User created successfully" });
            }
        );
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

router.delete('/users/:id', verifyToken, checkRole(['admin']), (req, res) => {
    const userId = req.params.id;
    if (userId == req.user.id) return res.status(400).json({ error: "You cannot delete your own account!" });
    db.run("DELETE FROM Users WHERE id = ?", [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User deleted successfully" });
    });
});

// --- 3. STORE MANAGEMENT ---
router.get('/stores', verifyToken, checkRole(['admin']), (req, res) => {
    const query = `SELECT Stores.*, AVG(Ratings.rating) as averageRating FROM Stores LEFT JOIN Ratings ON Stores.id = Ratings.store_id GROUP BY Stores.id`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// REVERTED: Removed 'images' from logic
router.post('/stores', verifyToken, checkRole(['admin']), (req, res) => {
    const { name, email, address, owner_id } = req.body;

    db.run(`INSERT INTO Stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)`, 
        [name, email, address, owner_id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: "Store created successfully" });
        }
    );
});

router.delete('/stores/:id', verifyToken, checkRole(['admin']), (req, res) => {
    db.run("DELETE FROM Stores WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Store deleted successfully" });
    });
});

module.exports = router;