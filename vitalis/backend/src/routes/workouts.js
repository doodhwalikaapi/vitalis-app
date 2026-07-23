const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { EXERCISES } = require('../data/exercises');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { generateWorkoutPlan } = require('../utils/aiEngine');

const router = express.Router();
router.use(requireAuth);

// Search & filter the exercise library
router.get('/exercises', (req, res) => {
  const { q, level, muscle, tag } = req.query;
  let results = EXERCISES;
  if (q) {
    const term = q.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(term));
  }
  if (level) results = results.filter((e) => e.level === level);
  if (muscle) results = results.filter((e) => e.muscles.some((m) => m.toLowerCase() === muscle.toLowerCase()));
  if (tag) results = results.filter((e) => e.tags.includes(tag));
  res.json({ exercises: results });
});

router.get('/exercises/:id', (req, res) => {
  const ex = EXERCISES.find((e) => e.id === req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found.' });
  res.json({ exercise: ex });
});

// AI-personalized weekly plan
router.get('/plan', async (req, res) => {
  const user = await User.findById(req.userId);
  const goals = await Goal.getGoals(req.userId);
  const plan = generateWorkoutPlan(user, goals);
  res.json({ plan });
});

router.post('/favorites/:exerciseId', async (req, res) => {
  await pool.query(
    `INSERT INTO favorite_exercises (user_id, exercise_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.userId, req.params.exerciseId]
  );
  res.json({ favorited: true });
});

router.delete('/favorites/:exerciseId', async (req, res) => {
  await pool.query(`DELETE FROM favorite_exercises WHERE user_id = $1 AND exercise_id = $2`, [
    req.userId,
    req.params.exerciseId
  ]);
  res.json({ favorited: false });
});

router.get('/favorites', async (req, res) => {
  const { rows } = await pool.query(`SELECT exercise_id FROM favorite_exercises WHERE user_id = $1`, [req.userId]);
  const ids = rows.map((r) => r.exercise_id);
  res.json({ exercises: EXERCISES.filter((e) => ids.includes(e.id)) });
});

router.post('/complete', async (req, res) => {
  const { exerciseId, sets, reps, durationMin, caloriesBurned } = req.body;
  if (!exerciseId) return res.status(400).json({ error: 'exerciseId is required.' });

  const { rows } = await pool.query(
    `INSERT INTO workout_logs (user_id, exercise_id, sets, reps, duration_min, calories_burned)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.userId, exerciseId, sets || null, reps || null, durationMin || null, caloriesBurned || null]
  );
  res.status(201).json({ log: rows[0] });
});

router.get('/history', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 50`,
    [req.userId]
  );
  res.json({ logs: rows });
});

module.exports = router;
