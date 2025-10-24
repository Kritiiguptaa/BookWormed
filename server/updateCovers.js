import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/bookModel.js';
import connectDB from './configs/mongodb.js';

dotenv.config();

const bookImageUpdates = [
  { isbn: "978-0262033844", coverImage: "https://covers.openlibrary.org/b/isbn/9780262033844-L.jpg" },
  { isbn: "978-0124077263", coverImage: "https://covers.openlibrary.org/b/isbn/9780124077263-L.jpg" },
  { isbn: "978-1118063330", coverImage: "https://covers.openlibrary.org/b/isbn/9781118063330-L.jpg" },
  { isbn: "978-0073523323", coverImage: "https://covers.openlibrary.org/b/isbn/9780073523323-L.jpg" },
  { isbn: "978-0132126953", coverImage: "https://covers.openlibrary.org/b/isbn/9780132126953-L.jpg" },
  { isbn: "978-0201633610", coverImage: "https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg" },
  { isbn: "978-0136042594", coverImage: "https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg" },
  { isbn: "978-0131103627", coverImage: "https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg" },
  { isbn: "978-0132350884", coverImage: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg" },
  { isbn: "978-0672324536", coverImage: "https://covers.openlibrary.org/b/isbn/9780672324536-L.jpg" },
  { isbn: "978-0078022128", coverImage: "https://covers.openlibrary.org/b/isbn/9780078022128-L.jpg" },
  { isbn: "978-0321486811", coverImage: "https://covers.openlibrary.org/b/isbn/9780321486811-L.jpg" },
  { isbn: "978-0321399526", coverImage: "https://covers.openlibrary.org/b/isbn/9780321399526-L.jpg" },
  { isbn: "978-0073383095", coverImage: "https://covers.openlibrary.org/b/isbn/9780073383095-L.jpg" },
  { isbn: "978-0123944245", coverImage: "https://covers.openlibrary.org/b/isbn/9780123944245-L.jpg" }
];

async function updateBookCovers() {
  try {
    await connectDB();
    
    console.log('Updating book cover images...\n');
    
    for (const update of bookImageUpdates) {
      const result = await Book.updateOne(
        { isbn: update.isbn },
        { $set: { coverImage: update.coverImage } }
      );
      
      if (result.modifiedCount > 0) {
        const book = await Book.findOne({ isbn: update.isbn });
        console.log(`✅ Updated: ${book.title}`);
        console.log(`   New cover: ${update.coverImage}\n`);
      } else {
        console.log(`⚠️  Book with ISBN ${update.isbn} not found or not updated\n`);
      }
    }

    console.log('🎉 Cover images updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating covers:', error);
    process.exit(1);
  }
}

updateBookCovers();
