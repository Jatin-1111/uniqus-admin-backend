import { Schema, model } from 'mongoose';

const instituteSchema = new Schema({
    // Basic details (Step 1)
    name: {
        type: String,
        required: function() { return this.status !== 'Incomplete'; },
        trim: true,
        unique: true
    },
    address: {
        type: String,
        required: function() { return this.status !== 'Incomplete'; },
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: function() { return this.status !== 'Incomplete'; }
    },
    remark: {
        type: String
    },
    city: {
        type: String,
        required: function() { return this.status !== 'Incomplete'; },
        enum: ['Chandigarh', 'Mohali', 'Panchkula', 'Bareilly']
    },
    InitialStudentCount: {
        type: Number,
        required: function() { return this.status !== 'Incomplete'; }
    },
    ActiveStudentCount: {
        type: Number,
        default: 0
    },
    InitialteacherCount: {
        type: Number,
        required: function() { return this.status !== 'Incomplete'; }
    },
    ActiveteacherCount: {
        type: Number,
        default: 0
    },

    // Documents (Step 2)
    documents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'InstituteDocument'
        }
    ],

    // Admin details (Step 3)
    Admin: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: function() { return this.status !== 'Incomplete'; }
    },

    // Additional fields
    classRooms: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Classroom'
        }
    ],
    
    // Tracking fields
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'associateusers',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    completedSteps: {
        basicDetails: {
            type: Boolean,
            default: false
        },
        documents: {
            type: Boolean,
            default: false
        },
        admin: {
            type: Boolean,
            default: false
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['Incomplete', 'Pending', 'Active', 'Freezed'],
        default: 'Incomplete'
    }
});

// Pre-save hook to update lastUpdated timestamp
instituteSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Add indexes for frequently queried fields
instituteSchema.index({ createdBy: 1, status: 1 });
instituteSchema.index({ name: 1 }, { unique: true });

const Institute = model('Institute', instituteSchema);

export default Institute;