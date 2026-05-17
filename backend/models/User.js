const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: function() { return !this.googleId; } },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: String,
    role: { type: String, enum: ['EMPLOYEE', 'MANAGER', 'ADMIN'], default: 'EMPLOYEE' },
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationCodeExpires: Date,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: String,
    designation: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
