const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Goal = require('../models/Goal');
const MetricsLog = require('../models/MetricsLog');
const { computeFullProfile } = require('../utils/healthCalculations');
const { generateWeeklyGoals, generateInsights } = require('../utils/aiEngine');

const router = express.Router();
router.use(requireAuth);

const MOTIVATIONAL_QUOTES = [
  'The only bad workout is the one that didn\'t happen.',
  'Small daily improvements lead to staggering long-term results.',
  'Discipline is choosing between what you want now and what you want most.',
  'Your body can do it. It\'s your mind you need to convince.',
  'Progress, not perfection.'
];

async function checkAndAwardBadges(userId, todayTotals, metrics, streakDays) {
  const candidates = [];
  if (todayTotals.steps >= metrics.dailyStepGoal) candidates.push('step_goal_hit');
  if (streakDays >= 7) candidates.push('week_streak');
  if (streakDays >= 30) candidates.push('month_streak');
  if (todayTotals.water_ml >= metrics.waterIntakeMl) candidates.push('hydration_hero');

  const awarded = [];
  for (const key of candidates) {
    const { rows } = await pool.query(
      `INSERT INTO badges (user_id, badge_key) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *`,
      [userId, key]
    );
    if (rows[0]) awarded.push(key);
  }
  return awarded;
}

async function computeStreak(userId) {
  const { rows } = await pool.query(
    `SELECT logged_date FROM health_metrics_log WHERE user_id = $1 GROUP BY logged_date ORDER BY logged_date DESC LIMIT 60`,
    [userId]
  );
  let streak = 0;
  let cursor = new Date();
  for (const row of rows) {
    const d = new Date(row.logged_date);
    const diffDays = Math.round((cursor - d) / 86400000);
    if (diffDays <= 1) {
      streak++;
      cursor = d;
    } else break;
  }
  return streak;
}

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const goals = await Goal.getGoals(req.userId);
    const metrics = computeFullProfile(user, goals);
    const today = await MetricsLog.getToday(req.userId);
    const history = await MetricsLog.getRange(req.userId, 7);

    const avgSleep = history.length
      ? +(history.reduce((s, r) => s + (parseFloat(r.sleep_hours) || 0), 0) / history.length).toFixed(1)
      : null;
    const avgSteps = history.length
      ? Math.round(history.reduce((s, r) => s + (parseInt(r.steps, 10) || 0), 0) / history.length)
      : null;
    const avgWater = history.length
      ? Math.round(history.reduce((s, r) => s + (parseInt(r.water_ml, 10) || 0), 0) / history.length)
      : null;

    const streakDays = await computeStreak(req.userId);
    const newBadges = await checkAndAwardBadges(req.userId, today, metrics, streakDays);
    const { rows: allBadges } = await pool.query(`SELECT badge_key, earned_at FROM badges WHERE user_id = $1`, [
      req.userId
    ]);

    const weeklyGoals = generateWeeklyGoals(goals, metrics);
    const insights = generateInsights(user, goals, metrics, { avgSleep, avgSteps, avgWater });
    const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

    res.json({
      user,
      goals,
      metrics,
      today,
      history,
      streakDays,
      badges: allBadges,
      newBadges,
      weeklyGoals,
      insights,
      quote
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

router.get('/export', async (req, res) => {
  const user = await User.findById(req.userId);
  const goals = await Goal.getGoals(req.userId);
  const metrics = computeFullProfile(user, goals);
  const history = await MetricsLog.getRange(req.userId, 30);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="vitalis-health-report.json"');
  res.json({ generatedAt: new Date().toISOString(), user, goals, metrics, history30Days: history });
});

module.exports = router;
