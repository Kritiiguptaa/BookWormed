import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  synopsis: {
    type: String,
    maxLength: 5000
  },
  publisher: {
    type: String,
    trim: true
  },
  publicationDate: {
    type: Date
  },
  publicationYear: {
    type: Number
  },
  genres: [{
    type: String,
    trim: true
  }],
  coverImage: {
    type: String,
    default: ''
  },
  pageCount: {
    type: Number
  },
  language: {
    type: String,
    default: 'English'
  },
  // Rating statistics
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // User interactions
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Popularity metrics
  viewCount: {
    type: Number,
    default: 0
  },
  addedToListsCount: {
    type: Number,
    default: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
bookSchema.index({ title: 'text', author: 'text', synopsis: 'text' });
bookSchema.index({ genres: 1 });
bookSchema.index({ publicationYear: 1 });
bookSchema.index({ averageRating: -1 });
bookSchema.index({ createdAt: -1 });

// Method to calculate and update average rating
bookSchema.methods.updateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = (sum / this.ratings.length).toFixed(2);
    this.totalRatings = this.ratings.length;
  }
};

const Book = mongoose.model('Book', bookSchema);

export default Book;
