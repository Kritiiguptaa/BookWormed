import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import bookRouter from './routes/bookRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import connectDB from './configs/mongodb.js';

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

app.get('/', (req,res) => res.send("API Working"))

app.listen(PORT, () => console.log('Server running on port ' + PORT));

