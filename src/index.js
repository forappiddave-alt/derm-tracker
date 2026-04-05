require('./db/schema');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: ALLOWED_ORIGINS.length
    ? (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
        else cb(new Error('Not allowed by CORS'));
      }
    : true,
  methods: ['GET', 'POST', 'DELETE'],
}));

app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/stats',   require('./routes/stats'));
app.use('/api/poem',    require('./routes/poem'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`DermTrack API listening on :${PORT}`));
