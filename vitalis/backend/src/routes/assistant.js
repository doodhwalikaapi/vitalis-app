const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { computeFullProfile } = require('../utils/healthCalculations');
const { answerHealthQuestion } = require('../utils/aiEngine');

const router = express.Router();
router.use(requireAuth);

// If ANTHROPIC_API_KEY is set in the environment, questions are answered by
// Claude with the user's real health profile injected as context. Otherwise
// the app falls back to the built-in rule-based engine so it always works
// out of the box with zero extra configuration or cost.
async function askClaude(question, user, goals, metrics) {
  const systemPrompt = `You are a supportive AI health & fitness assistant inside the Vitalis app.
Answer using ONLY the user's real profile below. Be concise (2-4 sentences), practical, and never give
medical diagnoses - suggest seeing a doctor for medical concerns.

User profile: ${user.age}y ${user.gender}, ${user.height_cm}cm, ${user.weight_kg}kg, activity level: ${user.activity_level}.
Goals: ${goals.join(', ') || 'none set'}.
Computed metrics: BMI ${metrics.bmi} (${metrics.bmiCategory}), BMR ${metrics.bmr} kcal, TDEE ${metrics.tdee} kcal,
daily calorie target ${metrics.calorieTarget} kcal, protein ${metrics.macros.proteinG}g, carbs ${metrics.macros.carbG}g,
fat ${metrics.macros.fatG}g, water goal ${metrics.waterIntakeMl}ml, sleep goal ${metrics.sleepHoursRecommended.min}-${metrics.sleepHoursRecommended.max}h,
step goal ${metrics.dailyStepGoal}.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text = data.content.map((c) => c.text || '').join('\n').trim();
  return text || null;
}

router.post('/ask', [body('question').trim().isLength({ min: 2, max: 500 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.userId);
    const goals = await Goal.getGoals(req.userId);
    const metrics = computeFullProfile(user, goals);

    let answer;
    let source = 'rules_engine';

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        answer = await askClaude(req.body.question, user, goals, metrics);
        source = 'claude';
      } catch (err) {
        console.error('Claude call failed, falling back to rules engine:', err.message);
      }
    }

    if (!answer) {
      answer = answerHealthQuestion(req.body.question, user, goals, metrics);
    }

    res.json({ answer, source });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to answer question.' });
  }
});

module.exports = router;
