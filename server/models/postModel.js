import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 300
  },
  content: {
    type: String,
    required: true,
    maxLength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxLength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for faster queries
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
