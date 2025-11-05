const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // ... (Your existing 'protect' function code is here)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.user.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- NEW ---
// Middleware to check if the user is an Admin
const isAdmin = (req, res, next) => {
    // This middleware MUST run *after* the 'protect' middleware,
    // so we can access req.user
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // 403 = Forbidden
    }
};

// --- NEW ---
// Middleware to check if the user is a Seller
const isSeller = (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        next(); // User is a seller, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as a seller' });
    }
};



// Middleware to check if the user is a Customer
const isCustomer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next(); // User is a customer, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as a customer' });
    }
};

// --- UPDATED EXPORTS ---
module.exports = { protect, isAdmin, isSeller, isCustomer };