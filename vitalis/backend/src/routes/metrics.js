const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Goal = require('../models/Goal');
const MetricsLog = require('../models/MetricsLog');
const { requireAuth } = require('../middleware/auth');
const { computeFullProfile } = require('../utils/healthCalculations');

const router = express.Router();
router.use(requireAuth);

// Computed health metrics (BMI, BMR, TDEE, macros, water, sleep, steps)
router.get('/', async (req, res) => {
  const user = await User.findById(req.userId);
  const goals = await Goal.getGoals(req.userId);
  const metrics = computeFullProfile(user, goals);
  res.json({ metrics });
});

// Sync daily activity data. `source` = manual | healthkit | health_connect
// Multiple sources are merged (max value wins) so switching devices never
// loses progress, per the product spec.
router.post(
  '/sync',
  [
    body('source').optional().isIn(['manual', 'healthkit', 'health_connect']),
    body('steps').optional().isInt({ min: 0 }),
    body('distanceKm').optional().isFloat({ min: 0 }),
    body('caloriesBurned').optional().isInt({ min: 0 }),
    body('activeMinutes').optional().isInt({ min: 0 }),
    body('sleepHours').optional().isFloat({ min: 0, max: 24 }),
    body('heartRate').optional().isInt({ min: 20, max: 250 }),
    body('waterMl').optional().isInt({ min: 0 }),
    body('date').optional().isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const saved = await MetricsLog.upsertDailyMetrics(req.userId, req.body);
    res.json({ metrics: saved });
  }
);

router.get('/today', async (req, res) => {
  const today = await MetricsLog.getToday(req.userId);
  res.json({ today });
});

router.get('/history', async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
  const rows = await MetricsLog.getRange(req.userId, days);
  res.json({ history: rows });
});

module.exports = router;
