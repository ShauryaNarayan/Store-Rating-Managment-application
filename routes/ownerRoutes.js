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
    db.get("SELECT id, name FROM Stores WHERE owner_id = ?", [ownerId], (err, store) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!store) return res.status(404).json({ error: "No store found for this owner." });

        // 2. Get Average Rating
        db.get("SELECT AVG(rating) as avgRating FROM Ratings WHERE store_id = ?", [store.id], (err, avgRow) => {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Get List of Users who rated this store
            const sql = `
                SELECT u.name, u.email, r.rating, r.created_at
                FROM Ratings r
                JOIN Users u ON r.user_id = u.id
                WHERE r.store_id = ?
                ORDER BY r.created_at DESC
            `;

            db.all(sql, [store.id], (err, raters) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    storeName: store.name,
                    averageRating: avgRow.avgRating || 0,
                    ratings: raters
                });
            });
        });
    });
});

module.exports = router;