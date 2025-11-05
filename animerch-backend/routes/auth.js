const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import our User model
const { protect, isAdmin } = require('../middleware/authMiddleware');



// --- @route   GET /api/auth/me ---
// @desc    Get the logged-in user's profile
// @access  Private (This is where we use the middleware!)
router.get('/me', protect, (req, res) => {
    // Because the 'protect' middleware ran first,
    // we now have access to 'req.user'.
    
    // Send back the user data that the middleware found.
    res.json(req.user);
});

// --- @route   GET /api/auth/admin-test ---
// @desc    A test route for admin access
// @access  Private/Admin
router.get(
    '/admin-test',
    protect,  // 1. First, check if user is logged in
    isAdmin,  // 2. Second, check if user is an admin
    (req, res) => {
        // This code only runs if both checks pass
        res.json({ 
            message: `Welcome, Admin ${req.user.username}! You found the secret area.` 
        });
    }
);








// --- @route   POST /api/auth/signup/customer ---
// @desc    Register a new customer
// @access  Public
router.post('/signup/customer', async (req, res) => {
    
    // 1. Get data from the request body
    const { username, email, password } = req.body;

    try {
        // 2. Check if user already exists
        let user = await User.findOne({ email: email });

        if (user) {
            // 400 = Bad Request
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 3. Create new user instance (but don't save yet)
        user = new User({
            username: username,
            email: email,
            password: password,
            role: 'customer' // Set role specifically
            // sellerDetails will be undefined, which is correct
        });

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10); // Generate a 'salt'
        user.password = await bcrypt.hash(password, salt); // Re-assign password as the hashed version

        // 5. Save the user to the database
        await user.save();

        // 6. Send a success response
        // We'll send back the user ID (but not the password)
        res.status(201).json({
            message: 'Customer registered successfully!',
            userId: user.id,
            username: user.username,
            role: user.role
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   POST /api/auth/signup/seller ---
// @desc    Register a new seller (pending verification)
// @access  Public
router.post('/signup/seller', async (req, res) => {
    
    // 1. Get all data from the request body
    const { 
        username, 
        email, 
        password, 
        shopName, 
        gstNumber, 
        businessAddress, 
        description 
    } = req.body;

    // --- Basic Validation (you can make this more complex later) ---
    if (!username || !email || !password || !shopName || !gstNumber || !businessAddress) {
        return res.status(400).json({ message: 'Please fill out all required fields.' });
    }

    try {
        // 2. Check if user already exists
        let user = await User.findOne({ email: email });

        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 3. Create new user instance
        user = new User({
            username: username,
            email: email,
            password: password,
            role: 'seller', // Set role to seller
            sellerDetails: {
                shopName: shopName,
                gstNumber: gstNumber,
                businessAddress: businessAddress,
                description: description
                // verificationStatus defaults to 'pending' from the schema
            }
        });

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 5. Save the user to the database
        await user.save();

        // 6. Send a success response
        res.status(201).json({
            message: 'Seller registered successfully! Your account is pending verification by an admin.',
            userId: user.id
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   POST /api/auth/login ---
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
            // Note: We send the same "Invalid credentials" message
            // for both wrong email and wrong password for security.
        }

        // 3. User is valid. Create the "payload" for our token.
        // This is the data we want to store inside the token.
        const payload = {
            user: {
                id: user.id,
                role: user.role
                // We add the role here so our frontend knows
                // if they are a 'customer', 'seller', or 'admin'
            }
        };

        // 4. Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Your secret key from .env
            { expiresIn: '30d' },    // Token expires in 30 days
            (err, token) => {
                if (err) throw err;
                // 5. Send the token back to the client
                res.json({ 
                    token,
                    message: `Welcome back, ${user.username}!`
                });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;