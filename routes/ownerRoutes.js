// backend/routes/ownerRoutes.js
const express = require('express');
const db = require('../database.js');
const { verifyToken, checkRole } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Middleware: Only 'owner' role
router.use(verifyToken, checkRole(['owner']));

// GET OWNER DASHBOARD
router.get('/dashboard', (req, res) => {
    const ownerId = req.user.id;

    // 1. Find the store owned by this user
    db.get("SELECT * FROM Stores WHERE owner_id = ?", [ownerId], (err, store) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!store) return res.status(404).json({ error: "No store found for this owner." });

        // 2. Get Ratings & User Details for this store
        // We use aliases (AS user_name) to match what the Frontend expects
        const sql = `
            SELECT 
                r.rating, 
                r.created_at,
                u.name as user_name, 
                u.email as user_email
            FROM Ratings r
            JOIN Users u ON r.user_id = u.id
            WHERE r.store_id = ?
            ORDER BY r.created_at DESC
        `;

        db.all(sql, [store.id], (err, ratings) => {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Calculate Stats
            const total = ratings.length;
            const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
            const average = total > 0 ? (sum / total).toFixed(1) : 0;

            // 4. Send response matching Frontend keys exactly
            res.json({
                storeName: store.name,
                address: store.address,       // Added Address
                averageRating: average,
                totalRatings: total,          // Added Total Count
                ratingsList: ratings
            });
        });
    });
});

module.exports = router;