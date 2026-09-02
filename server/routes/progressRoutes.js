import express from 'express';
import Progress from '../models/Progress.js';

const router = express.Router();
const DEFAULT_UNLOCKED_BY_WORLD = {
  0: 1,
  1: 1,
  2: 1,
  3: 1,
  4: 1,
};

function normalizeUnlockedByWorld(value) {
  const next = { ...DEFAULT_UNLOCKED_BY_WORLD };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return next;
  }

  for (const [worldKey, rawValue] of Object.entries(value)) {
    const worldIndex = Number(worldKey);
    const unlockedCount = Number(rawValue);

    if (Number.isInteger(worldIndex) && Number.isFinite(unlockedCount) && unlockedCount >= 1) {
      next[worldIndex] = Math.max(1, Math.floor(unlockedCount));
    }
  }

  return next;
}

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const existing = await Progress.findOne({ userId });
    if (existing) {
      return res.json({
        userId: existing.userId,
        unlockedByWorld: existing.unlockedByWorld,
      });
    }

    const created = await Progress.create({
      userId,
      unlockedByWorld: DEFAULT_UNLOCKED_BY_WORLD,
    });

    return res.json({
      userId: created.userId,
      unlockedByWorld: created.unlockedByWorld,
    });
  } catch (error) {
    console.error('GET /api/progress error:', error.message);
    return res.status(500).json({ error: 'Could not load progress' });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unlockedByWorld } = req.body || {};

    const sanitizedUnlocked = normalizeUnlockedByWorld(unlockedByWorld);

    const progress = await Progress.findOneAndUpdate(
      { userId },
      {
        userId,
        unlockedByWorld: sanitizedUnlocked,
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
    });
  } catch (error) {
    console.error('PUT /api/progress error:', error.message);
    return res.status(500).json({ error: 'Could not save progress' });
  }
});

router.post('/:userId/level-clear', async (req, res) => {
  try {
    const { userId } = req.params;
    const { worldIndex, clearedIndex } = req.body || {};

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

    const progress = await Progress.findOneAndUpdate(
      { userId },
      {
        userId,
        unlockedByWorld,
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
    });
  } catch (error) {
    console.error('POST /api/progress/level-clear error:', error.message);
    return res.status(500).json({ error: 'Could not save cleared level' });
  }
});

export default router;
