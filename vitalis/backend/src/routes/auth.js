const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
}

router.post(
  '/signup',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('age').isInt({ min: 10, max: 120 }),
    body('gender').isIn(['male', 'female', 'other']),
    body('heightCm').isFloat({ min: 50, max: 260 }),
    body('weightKg').isFloat({ min: 20, max: 400 }),
    body('activityLevel').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, age, gender, heightCm, weightKg, activityLevel, goals } = req.body;

    try {
      const existing = await User.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.createUser({ username, email, passwordHash, age, gender, heightCm, weightKg, activityLevel });

      if (Array.isArray(goals) && goals.length) {
        await Goal.setGoals(user.id, goals);
      }

      const token = signToken(user.id);
      res.status(201).json({ token, user });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken.' });
      console.error(err);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

      const token = signToken(user.id);
      delete user.password_hash;
      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed.' });
    }
  }
);

router.post(
  '/reset-password',
  requireAuth,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const user = await User.findByEmail((await User.findById(req.userId)).email);
      const match = await bcrypt.compare(req.body.currentPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

      const newHash = await bcrypt.hash(req.body.newPassword, 12);
      await User.updatePassword(req.userId, newHash);
      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  const goals = await Goal.getGoals(req.userId);
  res.json({ user, goals });
});

module.exports = router;
