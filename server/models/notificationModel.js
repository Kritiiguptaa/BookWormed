import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['follow', 'like_post', 'comment_post', 'like_review', 'comment_review', 'new_review']
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'review'
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'book'
  },
  comment: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model('notification', notificationSchema);

export default Notification;
