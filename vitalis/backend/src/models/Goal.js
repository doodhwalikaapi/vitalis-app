const { pool } = require('../config/db');

const VALID_GOALS = [
  'Improve Heart Health',
  'Lose Weight',
  'Burn Fat',
  'Gain Weight',
  'Build Muscle',
  'Improve Sleep',
  'Increase Endurance',
  'Improve Flexibility',
  'Healthy Lifestyle',
  'Reduce Stress'
];

async function setGoals(userId, goals) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM goals WHERE user_id = $1`, [userId]);
    for (const goal of goals) {
      if (!VALID_GOALS.includes(goal)) continue;
      await client.query(`INSERT INTO goals (user_id, goal) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId, goal]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getGoals(userId) {
  const { rows } = await pool.query(`SELECT goal FROM goals WHERE user_id = $1`, [userId]);
  return rows.map((r) => r.goal);
}

module.exports = { setGoals, getGoals, VALID_GOALS };
