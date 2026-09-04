import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /google route for Google Sign-In
// Requires GOOGLE_CLIENT_ID environment variable (from Google Cloud Console)
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body || {};

    if (!credential) {
      return res.status(400).json({ error: 'credential is required' });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.status(401).json({ error: 'invalid google token' });
    }

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        firstName: payload.given_name,
        lastName: payload.family_name,
      });
    }

    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/google error:', error.message);
    return res.status(500).json({ error: 'Could not authenticate with Google' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'first name, last name, email, and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'please enter a valid email address' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 chars' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'email is already registered' });
    }

    const passwordHash = await User.hashPassword(String(password));
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      firstName: firstName ? String(firstName).trim() : undefined,
      lastName: lastName ? String(lastName).trim() : undefined,
    });

    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/register error:', error.message);
    return res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'please enter a valid email address' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const isValid = await user.comparePassword(String(password));
    if (!isValid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error.message);
    return res.status(500).json({ error: 'Could not log in' });
  }
});

export default router;
