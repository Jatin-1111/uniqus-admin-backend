import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    // Add identification document field
    identificationDoc: {
        fileName: {
            type: String
        },
        accessUrl: {
            type: String
        },
        uploadedAt: {
            type: Date
        }
    },
    organizations: [{
        type: Schema.Types.ObjectId,
        ref: 'Institute'
    }]
});

// Hashing the password before saving
adminSchema.pre('save', async function (next) {
    const admin = this;
    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 8);
    }
    next();
});

// Compare password
adminSchema.methods.comparePassword = async function (password) {
    const admin = this;
    return await bcrypt.compare(password, admin.password);
}

const InstituteAdmin = model('Admin', adminSchema);

export default InstituteAdmin;