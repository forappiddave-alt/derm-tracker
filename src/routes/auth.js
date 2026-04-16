const { Router }   = require('express');
const { randomUUID } = require('crypto');
const db             = require('../db');
const { exchangeCode, fetchUserInfo } = require('../auth/yandex');
const { sign }               = require('../auth/jwt');
const { requireAuth }        = require('../auth/middleware');

const router = Router();

// POST /api/auth/yandex/callback  { code }
router.post('/yandex/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });

  try {
    const accessToken = await exchangeCode(code);
    const info        = await fetchUserInfo(accessToken);

    const yandexId   = String(info.id);
    const email       = info.default_email || null;
    const displayName = info.display_name || info.real_name || info.login || null;

    // Upsert user
    let user = db.prepare('SELECT uuid FROM users WHERE yandex_id = ?').get(yandexId);
    if (!user) {
      const uuid = randomUUID();
      db.prepare(
        'INSERT INTO users (uuid, yandex_id, email, display_name) VALUES (?, ?, ?, ?)'
      ).run(uuid, yandexId, email, displayName);
      user = { uuid };
    }
    // Update last_login_at
    db.prepare(
      "UPDATE users SET last_login_at = datetime('now'), email = ?, display_name = ? WHERE uuid = ?"
    ).run(email, displayName, user.uuid);

    const token = sign({ uuid: user.uuid });
    res.json({ token, user: { uuid: user.uuid, email, display_name: displayName } });
  } catch (e) {
    console.error('Auth error:', e.message);
    res.status(500).json({ error: 'auth_failed' });
  }
});

// GET /api/auth/server-callback?code=...
// Used for iOS PWA: nginx proxies /auth/callback on app.dermtracker.ru to this route.
// Sets Domain=.dermtracker.ru cookies so the PWA's WKWebView can read them.
router.get('/server-callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('https://app.dermtracker.ru/?auth_error=no_code');

  try {
    const accessToken = await exchangeCode(code);
    const info        = await fetchUserInfo(accessToken);

    const yandexId   = String(info.id);
    const email       = info.default_email || null;
    const displayName = info.display_name || info.real_name || info.login || null;

    // Upsert user
    let user = db.prepare('SELECT uuid FROM users WHERE yandex_id = ?').get(yandexId);
    if (!user) {
      const uuid = randomUUID();
      db.prepare(
        'INSERT INTO users (uuid, yandex_id, email, display_name) VALUES (?, ?, ?, ?)'
      ).run(uuid, yandexId, email, displayName);
      user = { uuid };
    }
    db.prepare(
      "UPDATE users SET last_login_at = datetime('now'), email = ?, display_name = ? WHERE uuid = ?"
    ).run(email, displayName, user.uuid);

    const token = sign({ uuid: user.uuid });
    const userJson = JSON.stringify({ uuid: user.uuid, email, display_name: displayName });

    const cookieOpts = 'Domain=.dermtracker.ru; Path=/; Secure; SameSite=Lax; Max-Age=2592000';
    res.setHeader('Set-Cookie', [
      `dermtrack_token=${token}; ${cookieOpts}`,
      `dermtrack_user=${encodeURIComponent(userJson)}; ${cookieOpts}`
    ]);
    res.redirect('https://app.dermtracker.ru/');
  } catch (e) {
    console.error('Server-callback error:', e.message);
    res.redirect('https://app.dermtracker.ru/?auth_error=auth_failed');
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT uuid, email, display_name, created_at FROM users WHERE uuid = ?'
  ).get(req.user.uuid);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user);
});

module.exports = router;
