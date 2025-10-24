import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/bookModel.js';
import connectDB from './configs/mongodb.js';

dotenv.config();

async function checkBooks() {
  try {
    await connectDB();
    
    const books = await Book.find().limit(5);
    
    console.log(`\n📚 Found ${books.length} books in database:\n`);
    
    books.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Cover Image: ${book.coverImage || 'NO COVER IMAGE'}`);
      console.log(`   Created: ${book.createdAt}`);
      console.log('');
    });

    const totalBooks = await Book.countDocuments();
    console.log(`\nTotal books in database: ${totalBooks}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBooks();
