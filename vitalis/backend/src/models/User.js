const { pool } = require('../config/db');

const PUBLIC_FIELDS = `id, username, email, age, gender, height_cm, weight_kg, activity_level, created_at, updated_at`;

async function createUser({ username, email, passwordHash, age, gender, heightCm, weightKg, activityLevel }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, age, gender, height_cm, weight_kg, activity_level)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING ${PUBLIC_FIELDS}`,
    [username, email, passwordHash, age, gender, heightCm, weightKg, activityLevel || 'moderate']
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [id]);
  return rows[0];
}

async function updateProfile(id, fields) {
  const allowed = ['username', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${i}`);
      values.push(fields[key]);
      i++;
    }
  }
  if (!sets.length) return findById(id);
  sets.push(`updated_at = now()`);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${PUBLIC_FIELDS}`,
    values
  );
  return rows[0];
}

async function updatePassword(id, passwordHash) {
  await pool.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [passwordHash, id]);
}

module.exports = { createUser, findByEmail, findById, updateProfile, updatePassword };
