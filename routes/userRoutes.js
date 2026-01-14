// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// 1. GET ALL STORES (Public or User Protected)
// This is the API called by your User Dashboard
router.get('/stores', verifyToken, checkRole(['user']), (req, res) => {
    const { search, sort } = req.query;

    // Base Query: Select ALL columns, including 'images'
    let query = `
        SELECT Stores.*, AVG(Ratings.rating) as overall_rating,
        (SELECT rating FROM Ratings WHERE user_id = ? AND store_id = Stores.id) as my_rating
        FROM Stores
        LEFT JOIN Ratings ON Stores.id = Ratings.store_id
    `;
    
    let params = [req.user.id]; // req.user.id comes from verifyToken middleware

    // Add Search Filter
    if (search) {
        query += ` WHERE Stores.name LIKE ? OR Stores.address LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY Stores.id`;

    // Add Sorting
    if (sort === 'name') {
        query += ` ORDER BY Stores.name ASC`;
    } else {
        query += ` ORDER BY overall_rating DESC`; // Default sort by best rating
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. SUBMIT / UPDATE RATING
router.post('/rating', verifyToken, checkRole(['user']), (req, res) => {
    const { store_id, rating } = req.body;
    db.run(`INSERT INTO Ratings (user_id, store_id, rating) VALUES (?, ?, ?)`, 
        [req.user.id, store_id, rating], 
        function(err) {
            if (err) return res.status(400).json({ error: "Rating failed or already exists" });
            res.json({ message: "Rating submitted" });
        }
    );
});

router.put('/rating', verifyToken, checkRole(['user']), (req, res) => {
    const { store_id, rating } = req.body;
    db.run(`UPDATE Ratings SET rating = ? WHERE user_id = ? AND store_id = ?`, 
        [rating, req.user.id, store_id], 
        function(err) {
            if (err) return res.status(500).json({ error: "Update failed" });
            res.json({ message: "Rating updated" });
        }
    );
});

module.exports = router;