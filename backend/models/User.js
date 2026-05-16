const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values for normal auth users
    },
    password: {
        type: String,
        required: function() { return !this.googleId; }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    picture: String,
    role: {
        type: String,
        enum: ['employee', 'manager', 'admin'],
        default: 'employee'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: String,
    verificationCodeExpires: Date,
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: String,
    designation: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
