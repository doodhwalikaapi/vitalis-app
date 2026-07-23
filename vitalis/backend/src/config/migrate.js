/**
 * Idempotent schema migration. Run automatically on server boot, and can
 * also be run manually with `npm run migrate`.
 */
const { pool } = require('./db');

const SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 10 AND 120),
  gender VARCHAR(20) NOT NULL,
  height_cm NUMERIC(5,2) NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  activity_level VARCHAR(30) NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal)
);

CREATE TABLE IF NOT EXISTS health_metrics_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(30) NOT NULL DEFAULT 'manual', -- manual | healthkit | health_connect
  steps INTEGER,
  distance_km NUMERIC(6,2),
  calories_burned INTEGER,
  active_minutes INTEGER,
  sleep_hours NUMERIC(4,2),
  heart_rate INTEGER,
  water_ml INTEGER,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_date, source)
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id VARCHAR(50) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_min INTEGER,
  calories_burned INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_exercises (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id VARCHAR(50) NOT NULL,
  UNIQUE(user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(50) NOT NULL,
  meal_type VARCHAR(20) NOT NULL DEFAULT 'meal',
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_key VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON health_metrics_log(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_workout_user ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_user_date ON meal_logs(user_id, logged_date);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('✅ Database schema is up to date.');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrate };
