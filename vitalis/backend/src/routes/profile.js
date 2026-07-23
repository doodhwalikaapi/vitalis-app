const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const user = await User.findById(req.userId);
  const goals = await Goal.getGoals(req.userId);
  res.json({ user, goals });
});

router.put(
  '/',
  [
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
    body('age').optional().isInt({ min: 10, max: 120 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('heightCm').optional().isFloat({ min: 50, max: 260 }),
    body('weightKg').optional().isFloat({ min: 20, max: 400 }),
    body('activityLevel').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, age, gender, heightCm, weightKg, activityLevel } = req.body;
    const user = await User.updateProfile(req.userId, {
      username,
      age,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity_level: activityLevel
    });
    res.json({ user });
  }
);

router.put('/goals', [body('goals').isArray({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  await Goal.setGoals(req.userId, req.body.goals);
  const goals = await Goal.getGoals(req.userId);
  res.json({ goals });
});

router.get('/goals/options', (req, res) => {
  res.json({ options: Goal.VALID_GOALS });
});

module.exports = router;
