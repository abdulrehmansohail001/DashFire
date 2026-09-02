import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const trimmedUsername = String(username).trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 24) {
      return res.status(400).json({ error: 'username must be between 3 and 24 chars' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 chars' });
    }

    const existingUser = await User.findOne({ username: trimmedUsername.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'username already taken' });
    }

    const passwordHash = await User.hashPassword(String(password));
    const user = await User.create({
      username: trimmedUsername.toLowerCase(),
      passwordHash,
    });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/register error:', error.message);
    return res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await User.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const isValid = await user.comparePassword(String(password));
    if (!isValid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error.message);
    return res.status(500).json({ error: 'Could not log in' });
  }
});

export default router;
