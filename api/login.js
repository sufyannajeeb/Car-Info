// api/login.js
import { createToken } from '../lib/session.js';

// Hardcoded credentials, as requested. To change them, edit these two lines.
const USERNAME = 'safwansufyan';
const PASSWORD = '1234';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { username, password } = body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    if (username === USERNAME && password === PASSWORD) {
      const token = createToken(7); // 7-day session
      const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
      const cookieParts = [
        `vault_auth=${token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${7 * 24 * 60 * 60}`
      ];
      if (isProd) cookieParts.push('Secure');
      res.setHeader('Set-Cookie', cookieParts.join('; '));
      return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ error: 'Incorrect username or password.' });
  } catch (err) {
    console.error('login API error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}