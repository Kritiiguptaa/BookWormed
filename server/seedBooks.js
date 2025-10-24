import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/bookModel.js';
import connectDB from './configs/mongodb.js';

dotenv.config();

const engineeringBooks = [
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "978-0262033844",
    synopsis: "A comprehensive textbook on computer algorithms, covering a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers. This book provides a comprehensive introduction to the modern study of computer algorithms.",
    genres: ["Computer Science", "Algorithms", "Programming"],
    publisher: "MIT Press",
    publicationYear: 2009,
    pageCount: 1312,
    language: "English",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780262033844-L.jpg"
  },
  {
    title: "Computer Organization and Design",
    author: "David A. Patterson, John L. Hennessy",
    isbn: "978-0124077263",
    synopsis: "The fifth edition of Computer Organization and Design moves forward into the post-PC era with new examples, exercises, and material highlighting the emergence of mobile computing and the cloud.",
    genres: ["Computer Architecture", "Hardware", "Engineering"],
    publisher: "Morgan Kaufmann",
    publicationYear: 2013,
    pageCount: 800,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51-p1U4K2LL._SX387_BO1,204,203,200_.jpg"
  },
  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
    isbn: "978-1118063330",
    synopsis: "Operating System Concepts continues to provide a solid theoretical foundation for understanding operating systems. The ninth edition has been thoroughly updated to include contemporary examples of how operating systems function.",
    genres: ["Operating Systems", "Computer Science", "Software Engineering"],
    publisher: "Wiley",
    publicationYear: 2012,
    pageCount: 944,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51RR7XrzX+L._SX389_BO1,204,203,200_.jpg"
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    isbn: "978-0073523323",
    synopsis: "Database System Concepts presents the fundamental concepts of database management in an intuitive manner geared toward allowing students to begin working with databases as quickly as possible.",
    genres: ["Database", "Computer Science", "Information Systems"],
    publisher: "McGraw-Hill Education",
    publicationYear: 2010,
    pageCount: 1376,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51XM7H8KWFL._SX389_BO1,204,203,200_.jpg"
  },
  {
    title: "Computer Networks",
    author: "Andrew S. Tanenbaum, David J. Wetherall",
    isbn: "978-0132126953",
    synopsis: "This classic textbook has been thoroughly revised and updated to take into account the enormous changes in the computer networking field in recent years. It covers the key principles, technological advances, and protocols used in modern networks.",
    genres: ["Networking", "Computer Science", "Telecommunications"],
    publisher: "Pearson",
    publicationYear: 2010,
    pageCount: 960,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51xp1UMN2BL._SX387_BO1,204,203,200_.jpg"
  },
  {
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    isbn: "978-0201633610",
    synopsis: "Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.",
    genres: ["Software Engineering", "Design Patterns", "Object-Oriented Programming"],
    publisher: "Addison-Wesley Professional",
    publicationYear: 1994,
    pageCount: 416,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51szD9HC9pL._SX395_BO1,204,203,200_.jpg"
  },
  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0136042594",
    synopsis: "The leading textbook in Artificial Intelligence. Used in over 1,400 universities in over 120 countries. The 22nd most cited computer science publication. This comprehensive textbook offers the most complete coverage of the field.",
    genres: ["Artificial Intelligence", "Machine Learning", "Computer Science"],
    publisher: "Pearson",
    publicationYear: 2009,
    pageCount: 1152,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51Q-QGd55oL._SX387_BO1,204,203,200_.jpg"
  },
  {
    title: "The C Programming Language",
    author: "Brian W. Kernighan, Dennis M. Ritchie",
    isbn: "978-0131103627",
    synopsis: "Written by the developers of C, this new version helps readers keep up with the finalized ANSI standard for C while showing how to take advantage of C's rich set of operators, economy of expression, improved control flow, and data structures.",
    genres: ["Programming", "C Language", "Computer Science"],
    publisher: "Prentice Hall",
    publicationYear: 1988,
    pageCount: 272,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/411ejyE8obL._SX377_BO1,204,203,200_.jpg"
  },
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    synopsis: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. This book will show you how to write good code and transform bad code into good code.",
    genres: ["Software Engineering", "Programming", "Best Practices"],
    publisher: "Prentice Hall",
    publicationYear: 2008,
    pageCount: 464,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/41xShlnTZTL._SX375_BO1,204,203,200_.jpg"
  },
  {
    title: "Data Structures and Algorithms in Java",
    author: "Robert Lafore",
    isbn: "978-0672324536",
    synopsis: "Data Structures and Algorithms in Java provides an introduction to data structures and algorithms, including their design, analysis, and implementation. The book uses Java as the programming language.",
    genres: ["Data Structures", "Algorithms", "Java", "Programming"],
    publisher: "Sams Publishing",
    publicationYear: 2002,
    pageCount: 800,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51AYmb-OXCL._SX396_BO1,204,203,200_.jpg"
  },
  {
    title: "Software Engineering: A Practitioner's Approach",
    author: "Roger S. Pressman",
    isbn: "978-0078022128",
    synopsis: "For over three decades, Software Engineering: A Practitioner's Approach has been the world's leading textbook in software engineering. The ninth edition represents a major restructuring and update of previous editions.",
    genres: ["Software Engineering", "Project Management", "Development"],
    publisher: "McGraw-Hill Education",
    publicationYear: 2014,
    pageCount: 976,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51ZKBVL0s5L._SX387_BO1,204,203,200_.jpg"
  },
  {
    title: "Compilers: Principles, Techniques, and Tools",
    author: "Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman",
    isbn: "978-0321486811",
    synopsis: "Known to professors, students, and developers worldwide as the 'Dragon Book,' this textbook is regarded as one of the classic definitive compiler technology texts. The second edition maintains the tradition of detailed coverage.",
    genres: ["Compilers", "Computer Science", "Programming Languages"],
    publisher: "Addison-Wesley",
    publicationYear: 2006,
    pageCount: 1000,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/41fJy0rmVtL._SX397_BO1,204,203,200_.jpg"
  },
  {
    title: "Computer Graphics: Principles and Practice",
    author: "John F. Hughes, Andries van Dam, Morgan McGuire",
    isbn: "978-0321399526",
    synopsis: "This book provides a comprehensive coverage of computer graphics. It is the only book to include both 2D and 3D techniques, and it is the most comprehensive text available on the subject.",
    genres: ["Computer Graphics", "Visualization", "3D Modeling"],
    publisher: "Addison-Wesley",
    publicationYear: 2013,
    pageCount: 1264,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51kPPxl0VfL._SX387_BO1,204,203,200_.jpg"
  },
  {
    title: "Discrete Mathematics and Its Applications",
    author: "Kenneth H. Rosen",
    isbn: "978-0073383095",
    synopsis: "Discrete Mathematics and Its Applications is intended for one or two term introductory discrete mathematics courses taken by students from a wide variety of majors, including computer science, mathematics, and engineering.",
    genres: ["Mathematics", "Discrete Math", "Logic"],
    publisher: "McGraw-Hill Education",
    publicationYear: 2011,
    pageCount: 972,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51PZE87iMEL._SX389_BO1,204,203,200_.jpg"
  },
  {
    title: "Digital Design and Computer Architecture",
    author: "David Harris, Sarah Harris",
    isbn: "978-0123944245",
    synopsis: "Digital Design and Computer Architecture takes a unique and modern approach to digital design. Beginning with digital logic gates and progressing to the design of combinational and sequential circuits, Harris and Harris use these fundamental building blocks as the basis for what follows.",
    genres: ["Digital Design", "Computer Architecture", "Hardware"],
    publisher: "Morgan Kaufmann",
    publicationYear: 2012,
    pageCount: 712,
    language: "English",
    coverImage: "https://m.media-amazon.com/images/I/51RxJ-aMbVL._SX389_BO1,204,203,200_.jpg"
  }
];

async function seedBooks() {
  try {
    await connectDB();
    
    // Clear existing books (optional - comment out if you want to keep existing data)
    // await Book.deleteMany({});
    // console.log('Cleared existing books');

    // Insert sample books
    const insertedBooks = await Book.insertMany(engineeringBooks);
    console.log(`✅ Successfully inserted ${insertedBooks.length} engineering books!`);
    
    // Display the inserted books
    insertedBooks.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} by ${book.author}`);
    });

    console.log('\n🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedBooks();
