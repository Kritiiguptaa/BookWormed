import 'dotenv/config';
import express from 'express'
import cors from 'cors'
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

// Intialize Middlewares
app.use(express.json())
app.use(cors())
// await connectDB()

// API routes
app.use('/api/user',userRouter)
app.use('/api/post',postRouter)
app.use('/api/book',bookRouter)
app.use('/api/notification',notificationRouter)
app.use('/api/stats', statsRouter)

app.get('/', (req,res) => res.send("API Working"))

app.listen(PORT, () => console.log('Server running on port ' + PORT));

