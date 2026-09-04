import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    maxlength: 30,
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 30,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  minimize: false,
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const User = mongoose.model('User', userSchema);

export default User;
