const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // We store the seller's ID for easy order management
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // We will store an array of the items in the order
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: false },
            price: { type: Number, required: true }, // Price *at time of order*
            product: { // Link to the original product
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentDetails: {
        // In a real app, this would be more complex,
        // e.g., 'paid', 'pending', and a paymentId from Stripe/PayPal
        status: { type: String, required: true, default: 'Pending' }
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
   orderStatus: {
        type: String,
        required: true,
        // We've replaced 'accepted' with 'confirmed' and added 'packing'
        enum: ['pending', 'confirmed', 'rejected', 'packing', 'shipped', 'delivered'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    estimatedDelivery: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);