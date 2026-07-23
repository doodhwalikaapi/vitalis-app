const { pool } = require('../config/db');

// Upserts a day's metrics. If multiple sources sync the same day (e.g. phone
// step counter + HealthKit), the higher value wins per field so switching
// devices never loses progress.
async function upsertDailyMetrics(userId, { source = 'manual', steps, distanceKm, caloriesBurned, activeMinutes, sleepHours, heartRate, waterMl, date }) {
  const logDate = date || new Date().toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `INSERT INTO health_metrics_log (user_id, source, steps, distance_km, calories_burned, active_minutes, sleep_hours, heart_rate, water_ml, logged_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (user_id, logged_date, source)
     DO UPDATE SET
       steps = GREATEST(COALESCE(health_metrics_log.steps,0), COALESCE(EXCLUDED.steps,0)),
       distance_km = GREATEST(COALESCE(health_metrics_log.distance_km,0), COALESCE(EXCLUDED.distance_km,0)),
       calories_burned = GREATEST(COALESCE(health_metrics_log.calories_burned,0), COALESCE(EXCLUDED.calories_burned,0)),
       active_minutes = GREATEST(COALESCE(health_metrics_log.active_minutes,0), COALESCE(EXCLUDED.active_minutes,0)),
       sleep_hours = COALESCE(EXCLUDED.sleep_hours, health_metrics_log.sleep_hours),
       heart_rate = COALESCE(EXCLUDED.heart_rate, health_metrics_log.heart_rate),
       water_ml = GREATEST(COALESCE(health_metrics_log.water_ml,0), COALESCE(EXCLUDED.water_ml,0))
     RETURNING *`,
    [userId, source, steps, distanceKm, caloriesBurned, activeMinutes, sleepHours, heartRate, waterMl, logDate]
  );
  return rows[0];
}

async function getRange(userId, days = 7) {
  const { rows } = await pool.query(
    `SELECT logged_date,
            SUM(steps) as steps,
            SUM(distance_km) as distance_km,
            SUM(calories_burned) as calories_burned,
            SUM(active_minutes) as active_minutes,
            MAX(sleep_hours) as sleep_hours,
            MAX(heart_rate) as heart_rate,
            SUM(water_ml) as water_ml
     FROM health_metrics_log
     WHERE user_id = $1 AND logged_date >= CURRENT_DATE - ($2 || ' days')::interval
     GROUP BY logged_date
     ORDER BY logged_date ASC`,
    [userId, days]
  );
  return rows;
}

async function getToday(userId) {
  const { rows } = await pool.query(
    `SELECT
        COALESCE(SUM(steps),0) as steps,
        COALESCE(SUM(distance_km),0) as distance_km,
        COALESCE(SUM(calories_burned),0) as calories_burned,
        COALESCE(SUM(active_minutes),0) as active_minutes,
        MAX(sleep_hours) as sleep_hours,
        MAX(heart_rate) as heart_rate,
        COALESCE(SUM(water_ml),0) as water_ml
     FROM health_metrics_log
     WHERE user_id = $1 AND logged_date = CURRENT_DATE`,
    [userId]
  );
  return rows[0];
}

module.exports = { upsertDailyMetrics, getRange, getToday };
