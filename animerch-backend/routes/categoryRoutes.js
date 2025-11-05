const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// --- @route   POST /api/categories ---
// @desc    Create a new category
// @access  Private/Admin
router.post('/', protect, isAdmin, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = new Category({
            name: name,
            createdBy: req.user.id // We get this from the 'protect' middleware
        });

        const createdCategory = await category.save();
        res.status(201).json(createdCategory);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   GET /api/categories ---
// @desc    Get all categories
// @access  Public (Everyone needs to see categories)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   DELETE /api/categories/:id ---
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.deleteOne(); // Use .deleteOne()
        res.json({ message: 'Category removed' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;