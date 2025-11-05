const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true // Removes whitespace
    },
    // We'll link this to the admin who created it
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // This references our 'User' model
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);