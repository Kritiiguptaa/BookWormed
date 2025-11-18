import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/reviewModel.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in your environment (or .env)');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.DB_NAME });
    console.log('Connected to DB');

    // Delete reviews where user or book is null
    const res = await Review.deleteMany({ $or: [{ user: null }, { book: null }] });
    console.log('Deleted reviews count:', res.deletedCount);

    // Optionally, print remaining docs with nulls (should be zero)
    const left = await Review.countDocuments({ $or: [{ user: null }, { book: null }] });
    console.log('Remaining reviews with null user/book:', left);

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error('Error in cleanup:', err);
    process.exit(1);
  }
};

run();
