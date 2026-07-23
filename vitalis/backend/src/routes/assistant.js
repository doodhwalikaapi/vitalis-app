const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { computeFullProfile } = require('../utils/healthCalculations');
const { answerHealthQuestion } = require('../utils/aiEngine');

const router = express.Router();
router.use(requireAuth);

// If ANTHROPIC_API_KEY is set, the assistant is powered by live Claude.
// Otherwise, if GEMINI_API_KEY is set, it uses Google's Gemini API, which
// has a genuinely free tier (no billing required) - a good default for
// getting real conversational AI without paying anything. If neither key
// is set, it falls back to the built-in rules engine so the app always
// works with zero configuration.
function buildSystemPrompt(user, goals, metrics) {
  return `You are the AI health & fitness coach inside the Vitalis app. Talk like a knowledgeable, encouraging friend having a normal conversation — not a form letter. Keep replies short and natural (usually 1-4 sentences, more only if the person clearly wants detail). Use casual language, contractions, the occasional light bit of humor if it fits, and follow up on what they actually said rather than restating their whole profile every time. Never give medical diagnoses; suggest a doctor for anything that sounds medical. Only bring up specific numbers from the profile below when they're actually relevant to what's being asked.

User profile: ${user.age}y ${user.gender}, ${user.height_cm}cm, ${user.weight_kg}kg, activity level: ${user.activity_level}.
Goals: ${goals.join(', ') || 'none set yet'}.
Computed metrics: BMI ${metrics.bmi} (${metrics.bmiCategory}), BMR ${metrics.bmr} kcal, TDEE ${metrics.tdee} kcal, daily calorie target ${metrics.calorieTarget} kcal, protein ${metrics.macros.proteinG}g, carbs ${metrics.macros.carbG}g, fat ${metrics.macros.fatG}g, water goal ${metrics.waterIntakeMl}ml, sleep goal ${metrics.sleepHoursRecommended.min}-${metrics.sleepHoursRecommended.max}h, step goal ${metrics.dailyStepGoal}.`;
}

async function askClaude(question, history, user, goals, metrics) {
  const trimmedHistory = (history || []).slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.text
  }));

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
      system: buildSystemPrompt(user, goals, metrics),
      messages: [...trimmedHistory, { role: 'user', content: question }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text = data.content.map((c) => c.text || '').join('\n').trim();
  return text || null;
}

async function askGroq(question, history, user, goals, metrics) {
  const trimmedHistory = (history || []).slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.text
  }));

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(user, goals, metrics) },
        ...trimmedHistory,
        { role: 'user', content: question }
      ],
      max_tokens: 400
    })
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}

async function askGemini(question, history, user, goals, metrics) {
  // Gemini uses "user"/"model" roles instead of "user"/"assistant".
  const trimmedHistory = (history || []).slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(user, goals, metrics) }] },
      contents: [...trimmedHistory, { role: 'user', parts: [{ text: question }] }]
    })
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim();
  return text || null;
}

router.post(
  '/ask',
  [body('question').trim().isLength({ min: 1, max: 500 }), body('history').optional().isArray({ max: 30 })],
  async (req, res) => {
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
          answer = await askClaude(req.body.question, req.body.history, user, goals, metrics);
          source = 'claude';
        } catch (err) {
          console.error('Claude call failed, trying next option:', err.message);
        }
      }

      if (!answer && process.env.GROQ_API_KEY) {
        try {
          answer = await askGroq(req.body.question, req.body.history, user, goals, metrics);
          source = 'groq';
        } catch (err) {
          console.error('Groq call failed, trying next option:', err.message);
        }
      }

      if (!answer && process.env.GEMINI_API_KEY) {
        try {
          answer = await askGemini(req.body.question, req.body.history, user, goals, metrics);
          source = 'gemini';
        } catch (err) {
          console.error('Gemini call failed, falling back to rules engine:', err.message);
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
  }
);

module.exports = router;

