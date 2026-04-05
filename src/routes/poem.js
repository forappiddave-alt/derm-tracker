const { Router } = require('express');
const db = require('../db');

const router = Router();
const USER_ID = 'default';

const SYMPTOMS = ['itching', 'sleep_disturbance', 'bleeding', 'weeping', 'cracking', 'peeling', 'dryness'];

// GET /api/poem
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM poem WHERE user_id = ?
    ORDER BY week_start DESC
    LIMIT 20
  `).all(USER_ID);
  res.json(rows);
});

// POST /api/poem — upsert по week_start
router.post('/', (req, res) => {
  const { week_start, ...rest } = req.body;
  if (!week_start) return res.status(400).json({ error: 'week_start is required' });

  const missing = SYMPTOMS.filter(s => rest[s] == null);
  if (missing.length) return res.status(400).json({ error: `missing fields: ${missing.join(', ')}` });

  const vals = SYMPTOMS.map(s => Number(rest[s]));
  const invalidRange = SYMPTOMS.find((s, i) => vals[i] < 0 || vals[i] > 5);
  if (invalidRange) return res.status(400).json({ error: `${invalidRange} must be 0–5` });

  const total_score = vals.reduce((a, b) => a + b, 0);

  db.prepare(`
    INSERT INTO poem (user_id, week_start, itching, sleep_disturbance, bleeding, weeping, cracking, peeling, dryness, total_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, week_start) DO UPDATE SET
      itching = excluded.itching,
      sleep_disturbance = excluded.sleep_disturbance,
      bleeding = excluded.bleeding,
      weeping = excluded.weeping,
      cracking = excluded.cracking,
      peeling = excluded.peeling,
      dryness = excluded.dryness,
      total_score = excluded.total_score
  `).run(USER_ID, week_start, ...vals, total_score);

  const row = db.prepare(
    'SELECT * FROM poem WHERE user_id = ? AND week_start = ?'
  ).get(USER_ID, week_start);
  res.json(row);
});

module.exports = router;
