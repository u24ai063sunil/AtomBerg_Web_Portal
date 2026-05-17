const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = req.cookies && req.cookies.token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = await User.findById(decoded.id || decoded.userId);
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'User not found', message: 'User not found' });
            }
            next();
        } catch (err) {
            return res.status(401).json({ success: false, error: 'Invalid token', message: 'Invalid token' });
        }
    } else {
        res.status(401).json({ success: false, error: 'Not authenticated', message: 'Not authenticated' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateJWT, requireRole };
