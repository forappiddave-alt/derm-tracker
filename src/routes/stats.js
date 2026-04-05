const { Router } = require('express');
const db = require('../db');

const router = Router();
const USER_ID = 'default';

// GET /api/stats?days=30
router.get('/', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().slice(0, 10);

  const entries = db.prepare(`
    SELECT * FROM entries
    WHERE user_id = ? AND date >= ?
    ORDER BY date ASC
  `).all(USER_ID, fromStr);

  if (!entries.length) return res.json({ entries: [], summary: {}, triggers: [] });

  // Средние значения симптомов
  const fields = ['itch', 'redness', 'dryness', 'swelling', 'stress', 'sleep', 'general_feel'];
  const summary = {};
  fields.forEach(f => {
    const vals = entries.map(e => e[f]).filter(v => v != null);
    summary[f] = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  });

  // Подсчёт исходов
  summary.outcomes = { good: 0, mid: 0, bad: 0 };
  entries.forEach(e => { if (e.outcome) summary.outcomes[e.outcome]++; });

  // Топ триггеров (погода)
  const triggerCount = {};
  entries.forEach(e => {
    if (!e.weather) return;
    const w = JSON.parse(e.weather);
    if (Array.isArray(w)) w.forEach(t => { triggerCount[t] = (triggerCount[t] || 0) + 1; });
  });
  const triggers = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Серия дней (streak)
  const sortedDates = entries.map(e => e.date).sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  for (const d of sortedDates) {
    if (d === cursor) { streak++; cursor = prevDay(cursor); }
    else break;
  }

  res.json({ entries, summary, triggers, streak });
});

function prevDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

module.exports = router;
