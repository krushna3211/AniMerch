const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, isSeller, isCustomer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); 


// --- @route   GET /api/products/:id ---
// @desc    Get a single product by its ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        // 1. Find the product by the ID from the URL (req.params.id)
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('seller', 'sellerDetails.shopName')
            .populate('reviews.user', 'username'); // Also populate the user for each review

        // 2. If no product is found, send a 404 error
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // 3. If found, send the product data
        res.json(product);

    } catch (error) {
        console.error(error.message);
        // This handles cases where the ID is not a valid MongoDB ID format
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});




// --- @route   GET /api/products ---
// @desc    Get all listed products (for customers)
// @access  Public
router.get('/', async (req, res) => {
    try {
        // We only find products that are marked as 'isListed'
        const products = await Product.find({ isListed: true })
            .populate('category', 'name') // Replaces the category ID with the category's name
            .populate('seller', 'sellerDetails.shopName'); // Replaces the seller ID with their shopName

        res.json(products);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});




// --- @route   POST /api/products ---
// @desc    Create a new product (for sellers)
// @access  Private/Seller
router.post(
    '/', 
    protect, 
    isSeller, 
    upload.array('images', 5),
    async (req, res) => {
    
    // 1. Check if the seller is approved
    if (req.user.sellerDetails.verificationStatus !== 'approved') {
        return res.status(403).json({ message: 'Your seller account is not approved to list products.' });
    }

    try {
        // 2. Get product data from the request
        const { name, description, images, category, price, stock } = req.body;

        // Get the image paths from req.files (Multer adds this)
        // We map over the array of file objects to get just their paths.
        const imagePaths = req.files.map(file => {
            // We add a leading '/' to make it a relative path from the root
            return `/${file.path}`; 
        });

        // 3. Create a new product instance
        const product = new Product({
            seller: req.user.id, // The ID comes from the 'protect' middleware
            name,
            description,
            images: imagePaths,
            category,
            price,
            stock
            // isListed defaults to true
        });

        // 4. Save to the database
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// --- @route   PUT /api/products/:id ---
// @desc    Update a product (by the seller who owns it)
// @access  Private/Seller
router.put(
    '/:id',
    protect,
    isSeller,
    upload.array('images', 5), // Also check for new images on update
    async (req, res) => {
        try {
            const { name, description, category, price, stock, isListed, existingImages } = req.body;

            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product.seller.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized to edit this product' });
            }

            // --- Start Image Handling ---
            // 1. Get paths of *newly* uploaded files
            const newImagePaths = req.files.map(file => `/${file.path}`);
            
            // 2. Get the list of *existing* images the user wants to keep
            let keptImages = [];
            if (existingImages) {
                // 'existingImages' might be a single string or an array
                keptImages = Array.isArray(existingImages) ? existingImages : [existingImages];
            }

            // 3. Combine the kept existing images and the new images
            product.images = [...keptImages, ...newImagePaths];
            // (Note: This doesn't delete old files from /uploads. That's a more advanced feature.)
            // --- End Image Handling ---

            // Update other fields
            product.name = name || product.name;
            product.description = description || product.description;
            product.category = category || product.category;
            product.price = price || product.price;
            product.stock = stock || product.stock;
            if (isListed !== undefined) {
                product.isListed = isListed;
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);


// --- @route   DELETE /api/products/:id ---
// @desc    Delete a product (by the seller who owns it)
// @access  Private/Seller
router.delete('/:id', protect, isSeller, async (req, res) => {
    try {
        // 1. Find the product by its ID
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 2. !! IMPORTANT !! Check if the logged-in user is the owner
        if (product.seller.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this product' });
        }

        // 3. Delete the product
        await product.deleteOne(); // Use .deleteOne() on the document

        res.json({ message: 'Product removed successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// --- @route   POST /api/products/:id/reviews ---
// @desc    Create a new review
// @access  Private/Customer
router.post(
    '/:id/reviews',
    protect,  // 1. Must be logged in
    isCustomer, // 2. Must be a customer
    async (req, res) => {
        const { rating, comment } = req.body;

        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // 3. Check if this user has already reviewed this product
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user.id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            // 4. Create the new review object
            const review = {
                username: req.user.username,
                rating: Number(rating),
                comment: comment,
                user: req.user.id
            };

            // 5. Add the new review to the product's reviews array
            product.reviews.push(review);

            // 6. Update the product's average rating
            product.numReviews = product.reviews.length;
            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            // 7. Save the product
            await product.save();

            res.status(201).json({ message: 'Review added' });

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;