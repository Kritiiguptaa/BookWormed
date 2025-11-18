import mongoose from 'mongoose';

const userListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  listType: {
    type: String,
    required: true,
    enum: ['want-to-read', 'currently-reading', 'read', 'favorites', 'custom'],
    default: 'want-to-read'
  },
  customListName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'abandoned'],
    default: 'not-started'
  },
  progress: {
    currentPage: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  dateStarted: {
    type: Date
  },
  dateFinished: {
    type: Date
  },
  notes: {
    type: String,
    maxLength: 1000
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure unique book per list per user
userListSchema.index({ user: 1, book: 1, listType: 1 }, { unique: true });
userListSchema.index({ user: 1, listType: 1 });
userListSchema.index({ createdAt: -1 });

// Virtual field for reading progress
userListSchema.virtual('readingProgress').get(function() {
  if (this.progress && this.progress.percentage) {
    return this.progress.percentage;
  }
  return 0;
});

// Ensure virtuals are included in JSON
userListSchema.set('toJSON', { virtuals: true });
userListSchema.set('toObject', { virtuals: true });

const UserList = mongoose.model('UserList', userListSchema);

export default UserList;
