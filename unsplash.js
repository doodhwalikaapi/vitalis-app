const { Pool } = require('pg');
require('dotenv').config();

// Render's managed PostgreSQL requires SSL in production but not in local dev.
const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = { pool };
