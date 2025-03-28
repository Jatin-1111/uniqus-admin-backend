import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const associateUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
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
    type: String
  },
  institutesOnboarded: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

associateUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
associateUserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const AssociateUser = mongoose.model('AssociateUser', associateUserSchema);

export default AssociateUser;