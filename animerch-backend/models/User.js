const mongoose = require('mongoose');

// We're creating a "sub-document" schema first.
// This will be nested inside the User model.
const sellerSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        required: true
    },
    businessAddress: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // No two users can have the same email
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    // This field will only contain data if the role is 'seller'.
    // It will be 'undefined' for customers and admins.
    sellerDetails: sellerSchema 
}, {
    // This adds 'createdAt' and 'updatedAt' fields automatically
    timestamps: true 
});

// 'User' will be the name of our collection in the database.
// Mongoose will automatically name it 'users' (plural, lowercase).
module.exports = mongoose.model('User', userSchema);