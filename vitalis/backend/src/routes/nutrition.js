const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { RECIPES } = require('../data/recipes');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { computeFullProfile } = require('../utils/healthCalculations');
const { generateMealPlan } = require('../utils/aiEngine');

const router = express.Router();
router.use(requireAuth);

router.get('/recipes', (req, res) => {
  const { q, mealType, tag } = req.query;
  let results = RECIPES;
  if (q) {
    const term = q.toLowerCase();
    results = results.filter((r) => r.name.toLowerCase().includes(term));
  }
  if (mealType) results = results.filter((r) => r.mealType === mealType);
  if (tag) results = results.filter((r) => r.tags.includes(tag));
  res.json({ recipes: results });
});

router.get('/recipes/:id', (req, res) => {
  const recipe = RECIPES.find((r) => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found.' });
  res.json({ recipe });
});

router.get('/plan', async (req, res) => {
  const user = await User.findById(req.userId);
  const goals = await Goal.getGoals(req.userId);
  const metrics = computeFullProfile(user, goals);
  const plan = generateMealPlan(user, goals, metrics.calorieTarget);
  res.json(plan);
});

router.post('/log', async (req, res) => {
  const { recipeId, mealType } = req.body;
  if (!recipeId) return res.status(400).json({ error: 'recipeId is required.' });
  const { rows } = await pool.query(
    `INSERT INTO meal_logs (user_id, recipe_id, meal_type) VALUES ($1,$2,$3) RETURNING *`,
    [req.userId, recipeId, mealType || 'meal']
  );
  res.status(201).json({ log: rows[0] });
});

router.get('/today', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT recipe_id, meal_type FROM meal_logs WHERE user_id = $1 AND logged_date = CURRENT_DATE`,
    [req.userId]
  );
  const logged = rows.map((r) => ({
    ...r,
    recipe: RECIPES.find((rc) => rc.id === r.recipe_id)
  }));
  const totals = logged.reduce(
    (acc, l) => {
      if (!l.recipe) return acc;
      acc.calories += l.recipe.calories;
      acc.proteinG += l.recipe.proteinG;
      acc.carbG += l.recipe.carbG;
      acc.fatG += l.recipe.fatG;
      acc.fiberG += l.recipe.fiberG;
      return acc;
    },
    { calories: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 }
  );
  res.json({ logged, totals });
});

module.exports = router;
