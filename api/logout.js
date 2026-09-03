// api/logout.js
export default function handler(req, res) {
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  const cookieParts = [
    'vault_auth=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isProd) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  return res.status(200).json({ ok: true });
}