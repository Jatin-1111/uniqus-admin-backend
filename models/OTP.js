import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    user: {
        type: String,
        enum: ['Admin', 'AssociateUser'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
});

// Add index for faster lookups
otpSchema.index({ email: 1, user: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;