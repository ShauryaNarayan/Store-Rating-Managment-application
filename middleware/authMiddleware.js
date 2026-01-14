// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// In a real app, put this in a .env file
const JWT_SECRET = "roxiler_secret_key_123";

const verifyToken = (req, res, next) => {
    // 1. Get the token from the header
    // Format usually is: "Bearer <token_string>"
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        return res.status(403).json({ error: "No token provided." });
    }

    const token = tokenHeader.split(' ')[1]; // Remove 'Bearer '

    if (!token) {
        return res.status(403).json({ error: "Malformed token." });
    }

    // 2. Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized: Invalid token." });
        }

        // 3. Save user info (id, role) to request for use in other routes
        req.user = decoded;
        next();
    });
};

// Helper to check for specific roles (e.g., only 'admin')
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied. Insufficient permissions." });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole, JWT_SECRET };