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
        enum: ['head', 'room', 'ground'],
        default: 'ground'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    assignedLocation: {
        type: String,
        default: ''
    },
    pendingRole: {
        type: String,
        enum: ['head', 'room', 'ground', null],
        default: null
    },
    roleChangeStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);