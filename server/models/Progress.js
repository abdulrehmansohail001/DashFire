import mongoose from 'mongoose';

const DEFAULT_UNLOCKED_BY_WORLD = {
  0: 1,
  1: 1,
  2: 1,
  3: 1,
  4: 1,
};

const progressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  unlockedByWorld: {
    type: Object,
    default: DEFAULT_UNLOCKED_BY_WORLD,
  },
  totalStars: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalCoins: {
    type: Number,
    default: 0,
    min: 0,
  },
  starsByLevel: {
    type: Object,
    default: () => ({}),
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  minimize: false,
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
