import express from 'express';
import Progress from '../models/Progress.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const DEFAULT_UNLOCKED_BY_WORLD = {
  0: 1,
  1: 1,
  2: 1,
  3: 1,
  4: 1,
};

function normalizeUnlockedByWorld(value) {
  const normalized = { ...DEFAULT_UNLOCKED_BY_WORLD };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return normalized;
  }

  for (const [worldKey, rawValue] of Object.entries(value)) {
    const worldIndex = Number(worldKey);
    const unlockedCount = Number(rawValue);

    if (Number.isInteger(worldIndex) && Number.isFinite(unlockedCount) && unlockedCount >= 1) {
      normalized[worldIndex] = Math.max(1, Math.floor(unlockedCount));
    }
  }

  return normalized;
}

function normalizeStarsByLevel(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const normalized = {};
  for (const [levelKey, rawValue] of Object.entries(value)) {
    const stars = Number(rawValue);
    if (Number.isFinite(stars) && stars >= 0) {
      normalized[levelKey] = Math.min(3, Math.floor(stars));
    }
  }
  return normalized;
}

router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId && req.user.username !== userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const existing = await Progress.findOne({ userId });
    if (existing) {
      return res.json({
        userId: existing.userId,
        unlockedByWorld: existing.unlockedByWorld,
        totalStars: existing.totalStars ?? 0,
        totalCoins: existing.totalCoins ?? 0,
        starsByLevel: normalizeStarsByLevel(existing.starsByLevel),
      });
    }

    const created = await Progress.create({
      userId,
      unlockedByWorld: DEFAULT_UNLOCKED_BY_WORLD,
      totalStars: 0,
      totalCoins: 0,
      starsByLevel: {},
    });

    return res.json({
      userId: created.userId,
      unlockedByWorld: created.unlockedByWorld,
      totalStars: created.totalStars ?? 0,
      totalCoins: created.totalCoins ?? 0,
      starsByLevel: {},
    });
  } catch (error) {
    console.error('GET /api/progress error:', error.message);
    return res.status(500).json({ error: 'Could not load progress' });
  }
});

router.put('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { unlockedByWorld, totalStars, totalCoins, starsByLevel } = req.body || {};

    if (req.user.userId !== userId && req.user.username !== userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const sanitizedUnlocked = normalizeUnlockedByWorld(unlockedByWorld);
    const safeStars = Number(totalStars) || 0;
    const safeCoins = Number(totalCoins) || 0;

    const progress = await Progress.findOneAndUpdate(
      { userId },
      {
        userId,
        unlockedByWorld: sanitizedUnlocked,
        totalStars: safeStars,
        totalCoins: safeCoins,
        starsByLevel: normalizeStarsByLevel(starsByLevel),
        updatedAt: Date.now(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      userId: progress.userId,
      unlockedByWorld: progress.unlockedByWorld,
      totalStars: progress.totalStars ?? 0,
      totalCoins: progress.totalCoins ?? 0,
      starsByLevel: normalizeStarsByLevel(progress.starsByLevel),
    });
  } catch (error) {
    console.error('PUT /api/progress error:', error.message);
    return res.status(500).json({ error: 'Could not save progress' });
  }
});

router.post('/:userId/level-clear', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { worldIndex, clearedIndex, stars, coins } = req.body || {};

    if (req.user.userId !== userId && req.user.username !== userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const worldId = Number(worldIndex);
    const clearedLevel = Number(clearedIndex);
    if (!Number.isInteger(worldId) || !Number.isInteger(clearedLevel)) {
      return res.status(400).json({ error: 'worldIndex and clearedIndex are required' });
    }

    const currentProgress = await Progress.findOne({ userId });
    const unlockedByWorld = normalizeUnlockedByWorld(
      currentProgress?.unlockedByWorld || DEFAULT_UNLOCKED_BY_WORLD
    );

    const currentUnlocked = Number(unlockedByWorld[worldId] ?? 1);
    const nextUnlocked = Math.max(currentUnlocked, clearedLevel + 2);
    unlockedByWorld[worldId] = nextUnlocked;

    const starsByLevel = normalizeStarsByLevel(currentProgress?.starsByLevel);
    const levelKey = `${worldId}:${clearedLevel}`;
    const submittedStars = Math.min(3, Math.max(0, Math.floor(Number(stars) || 0)));
    const previousBestStars = starsByLevel[levelKey] ?? 0;
    const improvedStars = Math.max(0, submittedStars - previousBestStars);
    starsByLevel[levelKey] = Math.max(previousBestStars, submittedStars);
    const totalStars = Math.max(0, Number(currentProgress?.totalStars ?? 0) + improvedStars);
    const submittedCoins = Math.max(0, Math.floor(Number(coins) || 0));
    const totalCoins = Math.max(0, Number(currentProgress?.totalCoins ?? 0) + submittedCoins);

    const progress = await Progress.findOneAndUpdate(
      { userId },
      {
        userId,
        unlockedByWorld,
        totalStars,
        totalCoins,
        starsByLevel,
        updatedAt: Date.now(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      userId: progress.userId,
      unlockedByWorld: progress.unlockedByWorld,
      totalStars: progress.totalStars ?? 0,
      totalCoins: progress.totalCoins ?? 0,
      starsByLevel: normalizeStarsByLevel(progress.starsByLevel),
    });
  } catch (error) {
    console.error('POST /api/progress/level-clear error:', error.message);
    return res.status(500).json({ error: 'Could not save cleared level' });
  }
});

export default router;
