const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: { // 'head', 'room', 'ground'
        type: String,
        enum: ['head', 'room', 'ground'], // Define allowed roles
        default: 'ground' // Default role for new signups, can be changed by head
    },
    isApproved: { // New field for head confirmation
        type: Boolean,
        default: false
    },
    email: { // Optional: for notifications, password reset etc.
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    assignedLocation: { // Optional: for ground staff assignment
        type: String,
        default: ''
    }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.model('User', UserSchema);