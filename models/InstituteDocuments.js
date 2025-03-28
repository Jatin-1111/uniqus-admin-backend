import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institute',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    accessUrl: {
        type: String,
        required: true
    },
    // Time tracking
    uploadedAt: {
        type: Date,
        default: Date.now
    },
});

// Helper method to check URL expiration
documentSchema.methods.isUrlExpired = function () {
    return !this.urlExpiry || new Date() > this.urlExpiry;
};

const InstituteDocument = mongoose.model('Document', documentSchema);

export default InstituteDocument;
