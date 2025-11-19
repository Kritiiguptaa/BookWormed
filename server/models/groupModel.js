import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Horror', 'Biography', 'Self-Help', 'Business', 'Academic', 'Poetry', 'General', 'Other'],
    default: 'General'
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  posts: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { minimize: false });

const groupModel = mongoose.models.group || mongoose.model('group', groupSchema);

export default groupModel;
