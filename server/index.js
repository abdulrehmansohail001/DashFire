// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dodge-shoot-game';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes will be mounted here as they're built, e.g.:
// import scoreRoutes from './routes/scoreRoutes.js';
// app.use('/api/scores', scoreRoutes);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting server without DB (routes needing DB will fail until MONGO_URI is set)');
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB)`));
  });
