import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDb from './utils/db.js';
import authRouter from './router/auth-router.js';
import verifyEmailRouter from './router/verifyEmail-router.js';

const app = express();

// Detailed CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/verify-email", verifyEmailRouter);

const PORT = 5000;

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server chl gya bhai at: ${PORT}`);
    });
});