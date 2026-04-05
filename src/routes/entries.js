const { Router } = require('express');
const db = require('../db');

const router = Router();
const USER_ID = 'default';

// GET /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM entries WHERE user_id = ?';
  const params = [USER_ID];

  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to)   { query += ' AND date <= ?'; params.push(to); }
  query += ' ORDER BY date DESC';

  const rows = db.prepare(query).all(...params);
  rows.forEach(r => { if (r.weather) r.weather = JSON.parse(r.weather); });
  res.json(rows);
});

// GET /api/entries/:date
router.get('/:date', (req, res) => {
  const row = db.prepare(
    'SELECT * FROM entries WHERE user_id = ? AND date = ?'
  ).get(USER_ID, req.params.date);

  if (!row) return res.status(404).json({ error: 'not found' });
  if (row.weather) row.weather = JSON.parse(row.weather);
  res.json(row);
});

// POST /api/entries — upsert по date
router.post('/', (req, res) => {
  const {
    date, itch, redness, dryness, swelling, outcome,
    stress, weather, food, other_triggers,
    cream, antihistamine, care, sleep, general_feel, notes
  } = req.body;

  if (!date) return res.status(400).json({ error: 'date is required' });

  db.prepare(`
    INSERT INTO entries
      (user_id, date, itch, redness, dryness, swelling, outcome,
       stress, weather, food, other_triggers,
       cream, antihistamine, care, sleep, general_feel, notes, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      itch = excluded.itch,
      redness = excluded.redness,
      dryness = excluded.dryness,
      swelling = excluded.swelling,
      outcome = excluded.outcome,
      stress = excluded.stress,
      weather = excluded.weather,
      food = excluded.food,
      other_triggers = excluded.other_triggers,
      cream = excluded.cream,
      antihistamine = excluded.antihistamine,
      care = excluded.care,
      sleep = excluded.sleep,
      general_feel = excluded.general_feel,
      notes = excluded.notes,
      updated_at = datetime('now')
  `).run(
    USER_ID, date, itch, redness, dryness, swelling, outcome,
    stress, weather ? JSON.stringify(weather) : null,
    food, other_triggers, cream, antihistamine ? 1 : 0,
    care, sleep, general_feel, notes
  );

  const row = db.prepare(
    'SELECT * FROM entries WHERE user_id = ? AND date = ?'
  ).get(USER_ID, date);
  if (row.weather) row.weather = JSON.parse(row.weather);
  res.json(row);
});

// DELETE /api/entries/:date
router.delete('/:date', (req, res) => {
  const { changes } = db.prepare(
    'DELETE FROM entries WHERE user_id = ? AND date = ?'
  ).run(USER_ID, req.params.date);

  if (!changes) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

module.exports = router;
