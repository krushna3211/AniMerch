const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// --- @route   GET /api/admin/pending-sellers ---
// @desc    Get all sellers with 'pending' verification
// @access  Private/Admin
router.get(
    '/pending-sellers',
    protect, // 1. Check for login
    isAdmin, // 2. Check if user is admin
    async (req, res) => {
        try {
            // Find users who are 'seller' AND their status is 'pending'
            const pendingSellers = await User.find({
                role: 'seller',
                'sellerDetails.verificationStatus': 'pending'
            }).select('-password'); // Exclude passwords from the result

            res.json(pendingSellers);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

// --- @route   PUT /api/admin/approve-seller/:id ---
// @desc    Approve a seller's verification
// @access  Private/Admin
router.put(
    '/approve-seller/:id',
    protect,
    isAdmin,
    async (req, res) => {
        try {
            // 1. Find the user by the ID in the URL
            const seller = await User.findById(req.params.id);

            // 2. Check if user exists and is a seller
            if (!seller || seller.role !== 'seller') {
                return res.status(404).json({ message: 'Seller not found' });
            }

            // 3. Check if they are already approved
            if (seller.sellerDetails.verificationStatus === 'approved') {
                return res.status(400).json({ message: 'Seller is already approved' });
            }

            // 4. Update the status
            seller.sellerDetails.verificationStatus = 'approved';

            // 5. Save the change
            await seller.save();

            // 6. Send success response
            res.json({ message: `Seller '${seller.sellerDetails.shopName}' has been approved.` });

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

// --- @route   PUT /api/admin/reject-seller/:id ---
// @desc    Reject a seller's verification
// @access  Private/Admin
router.put(
    '/reject-seller/:id',
    protect,
    isAdmin,
    async (req, res) => {
        try {
            // 1. Find the user by the ID in the URL
            const seller = await User.findById(req.params.id);

            // 2. Check if user exists and is a seller
            if (!seller || seller.role !== 'seller') {
                return res.status(404).json({ message: 'Seller not found' });
            }

            // 3. Check if they are already rejected
            if (seller.sellerDetails.verificationStatus === 'rejected') {
                return res.status(400).json({ message: 'Seller is already rejected' });
            }

            // 4. Update the status
            seller.sellerDetails.verificationStatus = 'rejected';

            // 5. Save the change
            await seller.save();

            // 6. Send success response
            res.json({ message: `Seller '${seller.sellerDetails.shopName}' has been rejected.` });

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;