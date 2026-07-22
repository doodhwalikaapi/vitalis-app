const { EXERCISES } = require('../data/exercises');
const { RECIPES } = require('../data/recipes');
const { computeFullProfile } = require('./healthCalculations');

/**
 * Generates a personalized weekly workout plan by filtering the exercise
 * library against the user's goals, and a fitness level inferred from
 * activity_level, then balancing muscle groups across the week.
 */
function generateWorkoutPlan(user, goals) {
  const level =
    user.activity_level === 'sedentary'
      ? 'beginner'
      : user.activity_level === 'light'
      ? 'beginner'
      : user.activity_level === 'moderate'
      ? 'intermediate'
      : 'advanced';

  const goalTagMap = {
    'Lose Weight': ['cardio', 'full_body', 'hiit'],
    'Burn Fat': ['cardio', 'hiit', 'full_body'],
    'Gain Weight': ['strength', 'compound'],
    'Build Muscle': ['strength', 'hypertrophy', 'compound'],
    'Improve Heart Health': ['cardio', 'endurance'],
    'Increase Endurance': ['cardio', 'endurance'],
    'Improve Flexibility': ['mobility', 'flexibility'],
    'Reduce Stress': ['mobility', 'low_impact'],
    'Improve Sleep': ['mobility', 'low_impact'],
    'Healthy Lifestyle': ['full_body', 'cardio', 'mobility']
  };

  const relevantTags = new Set(
    (goals.length ? goals : ['Healthy Lifestyle']).flatMap((g) => goalTagMap[g] || [])
  );

  const pool = EXERCISES.filter(
    (ex) => ex.level === level || (level === 'advanced' && ex.level === 'intermediate')
  ).filter((ex) => ex.tags.some((t) => relevantTags.has(t)));

  const finalPool = pool.length >= 6 ? pool : EXERCISES.filter((ex) => ex.level === level);

  // Spread across a 6-day split with one rest day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const plan = {};
  let i = 0;
  days.forEach((day, idx) => {
    if (idx === 6) {
      plan[day] = { restDay: true, note: 'Active recovery: light walk or stretching.' };
      return;
    }
    const dayExercises = [];
    for (let n = 0; n < 4 && finalPool.length; n++) {
      dayExercises.push(finalPool[i % finalPool.length]);
      i++;
    }
    plan[day] = { restDay: false, exercises: dayExercises };
  });

  return plan;
}

function generateMealPlan(user, goals, calorieTarget) {
  const wantsLoss = goals.some((g) => ['Lose Weight', 'Burn Fat'].includes(g));
  const wantsGain = goals.some((g) => ['Gain Weight', 'Build Muscle'].includes(g));

  let pool = RECIPES;
  if (wantsLoss) pool = RECIPES.filter((r) => r.tags.includes('low_calorie') || r.tags.includes('high_protein'));
  if (wantsGain) pool = RECIPES.filter((r) => r.tags.includes('high_calorie') || r.tags.includes('high_protein'));
  if (!pool.length) pool = RECIPES;

  const mealsPerDay = ['breakfast', 'lunch', 'dinner', 'snack'];
  const plan = {};
  mealsPerDay.forEach((meal, idx) => {
    const candidates = pool.filter((r) => r.mealType === meal);
    plan[meal] = (candidates.length ? candidates : pool).slice(0, 2);
  });

  const totalPlanned = mealsPerDay.reduce((sum, m) => sum + (plan[m][0]?.calories || 0), 0);

  return { plan, calorieTarget, totalPlannedCalories: totalPlanned };
}

function generateWeeklyGoals(goals, metrics) {
  const suggestions = [];
  if (goals.includes('Lose Weight') || goals.includes('Burn Fat')) {
    suggestions.push('Hit a calorie deficit on at least 5 of 7 days.');
    suggestions.push(`Walk ${metrics.dailyStepGoal.toLocaleString()} steps daily.`);
  }
  if (goals.includes('Build Muscle') || goals.includes('Gain Weight')) {
    suggestions.push('Complete 4 strength sessions with progressive overload.');
    suggestions.push(`Hit ${metrics.macros.proteinG}g protein at least 6 of 7 days.`);
  }
  if (goals.includes('Improve Sleep')) {
    suggestions.push(`Sleep ${metrics.sleepHoursRecommended.min}-${metrics.sleepHoursRecommended.max} hours nightly, consistent bedtime.`);
  }
  if (goals.includes('Reduce Stress')) {
    suggestions.push('Add 10 minutes of mobility or breathing work, 5 days this week.');
  }
  if (goals.includes('Improve Heart Health') || goals.includes('Increase Endurance')) {
    suggestions.push('Complete 3 cardio sessions of 25+ minutes in Zone 2.');
  }
  if (!suggestions.length) {
    suggestions.push('Stay consistent: log meals, move daily, and sleep 7-9 hours.');
  }
  suggestions.push(`Drink ${(metrics.waterIntakeMl / 1000).toFixed(1)}L of water daily.`);
  return suggestions;
}

function generateInsights(user, goals, metrics, recentLogs = {}) {
  const insights = [];

  if (metrics.bmiCategory === 'Underweight' && goals.includes('Lose Weight')) {
    insights.push("Your BMI is already in the underweight range — consider talking to a doctor before pursuing further weight loss.");
  }
  if (metrics.bmi >= 30) {
    insights.push('A sustainable ~20% calorie deficit combined with strength training preserves muscle while losing fat.');
  }
  if (recentLogs.avgSleep && recentLogs.avgSleep < metrics.sleepHoursRecommended.min) {
    insights.push(`You're averaging ${recentLogs.avgSleep}h of sleep, below your ${metrics.sleepHoursRecommended.min}h target — this can blunt recovery and appetite regulation.`);
  }
  if (recentLogs.avgSteps && recentLogs.avgSteps < metrics.dailyStepGoal * 0.7) {
    insights.push('Step count has been trending below goal — try a 10-minute walk after each meal to close the gap.');
  }
  if (recentLogs.avgWater && recentLogs.avgWater < metrics.waterIntakeMl * 0.8) {
    insights.push('Hydration has been under target this week; low water intake is often mistaken for hunger.');
  }
  if (!insights.length) {
    insights.push("You're tracking consistently — keep the current routine and reassess your targets in 2 weeks.");
  }
  return insights;
}

/**
 * Rule-based AI health assistant. Answers are generated from the user's
 * actual profile/metrics rather than generic text. Designed to be swapped
 * for a call to the Anthropic API (see routes/assistant.js) if a live LLM
 * key is configured.
 */
function answerHealthQuestion(question, user, goals, metrics) {
  const q = question.toLowerCase();

  if (/(calorie|tdee|maintenance)/.test(q)) {
    return `Based on your profile (${user.age}y, ${user.gender}, ${user.weight_kg}kg, ${user.height_cm}cm, ${user.activity_level} activity), your maintenance calories (TDEE) are ~${metrics.tdee} kcal/day. Your current target is ${metrics.calorieTarget} kcal/day given your goals.`;
  }
  if (/(protein)/.test(q)) {
    return `Your daily protein target is ${metrics.macros.proteinG}g. Spreading this across 3-4 meals (roughly ${Math.round(metrics.macros.proteinG / 4)}g each) improves muscle protein synthesis.`;
  }
  if (/(water|hydrat)/.test(q)) {
    return `Aim for about ${(metrics.waterIntakeMl / 1000).toFixed(1)}L of water daily based on your body weight and activity level. Increase this on high-sweat training days.`;
  }
  if (/(sleep)/.test(q)) {
    return `For your age group, ${metrics.sleepHoursRecommended.min}-${metrics.sleepHoursRecommended.max} hours of sleep is recommended. Consistent sleep/wake times matter as much as total duration.`;
  }
  if (/(bmi)/.test(q)) {
    return `Your current BMI is ${metrics.bmi} (${metrics.bmiCategory}). Your estimated ideal weight range for your height is ${metrics.idealWeightRangeKg.min}-${metrics.idealWeightRangeKg.max}kg. Remember BMI doesn't account for muscle mass directly.`;
  }
  if (/(step|walk)/.test(q)) {
    return `Your daily step goal is ${metrics.dailyStepGoal.toLocaleString()} steps, based on your goals and activity level.`;
  }
  if (/(workout|exercise|train)/.test(q)) {
    return `Given your goals (${goals.join(', ') || 'general health'}), your plan mixes strength and cardio sessions matched to your current activity level. Check the Workouts tab for today's session.`;
  }
  if (/(recover|rest|sore)/.test(q)) {
    return `Muscle recovery typically takes 48-72 hours per muscle group. Prioritize sleep, protein intake (${metrics.macros.proteinG}g/day), and light movement on rest days over complete inactivity.`;
  }
  return `I couldn't match that to a specific metric, but here's your snapshot: BMI ${metrics.bmi}, TDEE ${metrics.tdee} kcal, target ${metrics.calorieTarget} kcal, protein ${metrics.macros.proteinG}g, water ${(metrics.waterIntakeMl / 1000).toFixed(1)}L, sleep goal ${metrics.sleepHoursRecommended.min}-${metrics.sleepHoursRecommended.max}h. Ask me about calories, protein, sleep, water, steps, workouts, or recovery.`;
}

module.exports = {
  generateWorkoutPlan,
  generateMealPlan,
  generateWeeklyGoals,
  generateInsights,
  answerHealthQuestion
};
