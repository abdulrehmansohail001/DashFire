import express from 'express';
import Progress from '../models/Progress.js';
import { requireAuth } from '../middleware/auth.js';
import { SHOP_CATALOG } from '../shopCatalog.js';

const router = express.Router();

function getUserId(req) {
  return String(req.user.userId);
}

function progressFields(progress) {
  return {
    ownedItems: progress.ownedItems || [],
    equippedSkin: progress.equippedSkin || 'skin_01',
    equippedBulletSkin: progress.equippedBulletSkin || 'bullet_01',
    totalCoins: progress.totalCoins ?? 0,
  };
}

async function getOrCreateProgress(userId) {
  const existing = await Progress.findOne({ userId });
  if (existing) return existing;

  return Progress.create({ userId });
}

router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const progress = await getOrCreateProgress(getUserId(req));
    return res.json(progressFields(progress));
  } catch (error) {
    console.error('GET /api/shop/inventory error:', error.message);
    return res.status(500).json({ error: 'Could not load shop inventory' });
  }
});

router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body || {};
    const item = SHOP_CATALOG.find((catalogItem) => catalogItem.id === itemId);

    if (!item) {
      return res.status(400).json({ error: 'item not found' });
    }

    const progress = await getOrCreateProgress(getUserId(req));
    const ownedItems = progress.ownedItems || [];

    if (ownedItems.includes(item.id)) {
      return res.status(400).json({ error: 'already owned' });
    }

    if ((progress.totalCoins ?? 0) < item.price) {
      return res.status(400).json({ error: 'not enough coins' });
    }

    progress.totalCoins -= item.price;
    progress.ownedItems = [...ownedItems, item.id];
    await progress.save();

    return res.json(progressFields(progress));
  } catch (error) {
    console.error('POST /api/shop/purchase error:', error.message);
    return res.status(500).json({ error: 'Could not purchase shop item' });
  }
});

router.post('/equip', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body || {};
    const item = SHOP_CATALOG.find((catalogItem) => catalogItem.id === itemId);

    if (!item) {
      return res.status(400).json({ error: 'item not found' });
    }

    const progress = await getOrCreateProgress(getUserId(req));
    if (!(progress.ownedItems || []).includes(item.id)) {
      return res.status(400).json({ error: 'item not owned' });
    }

    if (item.category === 'skin') {
      progress.equippedSkin = item.id;
    } else if (item.category === 'bulletSkin') {
      progress.equippedBulletSkin = item.id;
    } else {
      return res.status(400).json({ error: 'item category not supported' });
    }

    await progress.save();
    return res.json(progressFields(progress));
  } catch (error) {
    console.error('POST /api/shop/equip error:', error.message);
    return res.status(500).json({ error: 'Could not equip shop item' });
  }
});

export default router;