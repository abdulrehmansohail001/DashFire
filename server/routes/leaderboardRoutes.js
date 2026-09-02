import express from 'express';
import Progress from '../models/Progress.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const entries = await Progress.find({}, {
      _id: 0,
      userId: 1,
      totalStars: 1,
    })
      .sort({ totalStars: -1, userId: 1 })
      .limit(20)
      .lean();

    return res.json({
      entries: entries.map((entry, index) => ({
        rank: index + 1,
        player: entry.userId,
        stars: Number(entry.totalStars) || 0,
      })),
    });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error.message);
    return res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

export default router;