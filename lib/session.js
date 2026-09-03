// lib/session.js
// Signed, stateless session tokens — no session DB needed.
// Token format:  "<expiryTimestamp>.<hmacSignatureHex>"
//
// SECURITY NOTE: set a real SESSION_SECRET env var in Vercel
// (Project Settings -> Environment Variables). If it's not set,
// a fallback is used so the app still works, but anyone who reads
// this source could forge sessions. Takes 10 seconds to set — see
// the README section at the bottom of this file.

import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'vault-fallback-secret-please-set-SESSION_SECRET-env-var';

export function createToken(days = 7) {
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = String(expiry);
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!/^\d+$/.test(payload)) return false;

  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  return Number(payload) > Date.now();
}

export function getCookieToken(req, name = 'vault_auth') {
  const header = req.headers.cookie || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/*
  --- Setting SESSION_SECRET (recommended, 1 minute) ---
  1. Generate a random string, e.g. run locally: openssl rand -hex 32
  2. Vercel dashboard -> your project -> Settings -> Environment Variables
  3. Add SESSION_SECRET = <that random string> for Production (and Preview)
  4. Redeploy.
  Without this step the app still works fully, it just uses a fallback secret.
*/