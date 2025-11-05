const mongoose = require('mongoose');

// This is a sub-document schema for reviews
const reviewSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    username: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true }
}, {
    timestamps: true
});

const productSchema = new mongoose.Schema({
    // The seller who created this product
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: [{
        type: String // We'll store an array of image URLs
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    isListed: {
        type: Boolean,
        default: true
    },
    reviews: [reviewSchema], // An array of reviews
    rating: { // The average rating
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);