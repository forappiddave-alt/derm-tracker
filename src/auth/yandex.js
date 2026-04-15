const CLIENT_ID     = process.env.YANDEX_CLIENT_ID;
const CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET;
const REDIRECT_URI  = 'https://app.dermtracker.ru/auth/callback';

async function exchangeCode(code) {
  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri:  REDIRECT_URI,
  });
  const res = await fetch('https://oauth.yandex.ru/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yandex token error: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function fetchUserInfo(accessToken) {
  const res = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { Authorization: `OAuth ${accessToken}` },
  });
  if (!res.ok) throw new Error('Yandex userinfo error');
  return res.json(); // { id, login, default_email, real_name, display_name, ... }
}

module.exports = { exchangeCode, fetchUserInfo };
