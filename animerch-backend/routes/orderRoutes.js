const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, isCustomer, isSeller } = require('../middleware/authMiddleware');

// --- @route   POST /api/orders ---
// @desc    Create a new order
// @access  Private/Customer
router.post(
    '/',
    protect,
    isCustomer,
    async (req, res) => {
        // 1. Get data from the frontend
        const { orderItems, shippingAddress } = req.body;

        try {
            // --- 2. Check if cart is empty ---
            if (!orderItems || orderItems.length === 0) {
                return res.status(400).json({ message: 'No order items' });
            }

            // --- 3. Get the Seller ID from the first item ---
            // We'll use this to ensure all items are from the same seller
            const firstProduct = await Product.findById(orderItems[0].product);
            if (!firstProduct) {
                 return res.status(404).json({ message: `Product with ID ${orderItems[0].product} not found` });
            }
            const sellerId = firstProduct.seller;

            let totalOrderPrice = 0;
            const processedOrderItems = [];

            // --- 4. Loop through items, check stock, and calculate price ---
            for (const item of orderItems) {
                const product = await Product.findById(item.product);

                if (!product) {
                    return res.status(404).json({ message: `Product ${item.product} not found` });
                }

                // Check if all items are from the same seller
                if (product.seller.toString() !== sellerId.toString()) {
                    return res.status(400).json({ 
                        message: 'Order items must be from the same seller. Please create separate orders.' 
                    });
                }

                // Check stock
                if (product.stock < item.qty) {
                    return res.status(400).json({ message: `Not enough stock for ${product.name}` });
                }

                // Add to total price
                totalOrderPrice += product.price * item.qty;

                // Add to our "snapshot" array
                processedOrderItems.push({
                    name: product.name,
                    qty: item.qty,
                    image: product.images ? product.images[0] : null,
                    price: product.price,
                    product: product._id
                });

                // --- 5. Decrement the stock ---
                product.stock = product.stock - item.qty;
                await product.save();
            }

            // --- 6. Create the new order ---
            const order = new Order({
                customer: req.user.id,
                seller: sellerId,
                orderItems: processedOrderItems,
                shippingAddress: shippingAddress,
                totalPrice: totalOrderPrice,
                // other fields (orderStatus, paymentDetails) have defaults
            });

            // --- 7. Save the order to the database ---
            const createdOrder = await order.save();

            res.status(201).json(createdOrder);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);



// --- @route   GET /api/orders/myorders ---
// @desc    Get all orders for the logged-in customer
// @access  Private/Customer
router.get(
    '/myorders',
    protect,
    isCustomer,
    async (req, res) => {
        try {
            // 1. Find all orders where the 'customer' field is the logged-in user's ID
            const orders = await Order.find({ customer: req.user.id })
                .populate('seller', 'sellerDetails.shopName') // Show the seller's shop name
                .sort({ createdAt: -1 }); // Show the most recent orders first

            // 2. Send the list of orders
            res.json(orders);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

// --- @route   GET /api/orders/sellerorders ---
// @desc    Get all orders for the logged-in seller
// @access  Private/Seller
router.get(
    '/sellerorders',
    protect,
    isSeller,
    async (req, res) => {
        try {
            // 1. Find all orders where the 'seller' field is the logged-in user's ID
            const orders = await Order.find({ seller: req.user.id })
                .populate('customer', 'username email') // Show the customer's name and email
                .sort({ createdAt: -1 }); // Show the most recent orders first

            // 2. Send the list of orders
            res.json(orders);

        } catch (error)
        {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);


// --- @route   PUT /api/orders/:id/status ---
// @desc    Update an order's status (by the seller)
// @access  Private/Seller
router.put(
    '/:id/status',
    protect,
    isSeller,
    async (req, res) => {
        const { orderStatus, rejectionReason, estimatedDelivery } = req.body;

        // --- 1. UPDATE THIS LIST ---
        const validStatuses = ['confirmed', 'rejected', 'packing', 'shipped', 'delivered'];
        if (!orderStatus || !validStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid or missing order status' });
        }

        try {
            const order = await Order.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            if (order.seller.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized to update this order' });
            }

            // 4. Update the status and other fields
            order.orderStatus = orderStatus;

            if (orderStatus === 'rejected' && rejectionReason) {
                order.rejectionReason = rejectionReason;
            }

            // --- 2. UPDATE THIS CHECK ---
            if (orderStatus === 'confirmed' && estimatedDelivery) {
                order.estimatedDelivery = estimatedDelivery;
            }

            const updatedOrder = await order.save();
            res.json(updatedOrder);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;