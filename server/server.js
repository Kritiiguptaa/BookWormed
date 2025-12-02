import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import bookRouter from './routes/bookRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import statsRouter from './routes/statsRoutes.js';
import connectDB from './configs/mongodb.js';

// Import models to ensure they are registered
import './models/postModel.js';
import './models/userModel.js';
import './models/bookModel.js';
import './models/reviewModel.js';
import './models/notificationModel.js';

// App Config
const PORT = process.env.PORT || 4000
const app = express();
await connectDB()

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window (increased for development)
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for email endpoints (forgot password, verification)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 email requests per hour per IP (increased for development)
  message: { success: false, message: 'Too many email requests. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration - Restrict to frontend origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://book-wormed.vercel.app/'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Intialize Middlewares
app.use(express.json())
// await connectDB()

// API routes
app.use('/api/user', authLimiter, userRouter)
app.use('/api/post',postRouter)
app.use('/api/book',bookRouter)
app.use('/api/notification',notificationRouter)
app.use('/api/stats', statsRouter)

// Export rate limiters for specific routes
export { emailLimiter }

app.get('/', (req,res) => res.send("API Working"))

// app.listen(PORT, () => console.log('Server running on port ' + PORT));
// For Vercel: export the app instead of listening


// For local development only
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

export default app;
