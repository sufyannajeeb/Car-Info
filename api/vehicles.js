// api/vehicles.js
// Stores one shared JSON list of vehicles in Upstash Redis.
// Now requires a valid session cookie (set by /api/login) on every request.

import { Redis } from '@upstash/redis';
import { verifyToken, getCookieToken } from '../lib/session.js';

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
const KEY = 'vehicles';

export default async function handler(req, res) {
  // --- auth gate ---
  const token = getCookieToken(req, 'vault_auth');
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }

  try {
    if (req.method === 'GET') {
      const vehicles = (await redis.get(KEY)) || [];
      return res.status(200).json(vehicles);
    }

    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

      if (!body.id || !body.ownerName || !body.plate) {
        return res.status(400).json({ error: 'Missing required fields (id, ownerName, plate).' });
      }

      const vehicles = (await redis.get(KEY)) || [];
      const idx = vehicles.findIndex((v) => v.id === body.id);

      if (idx > -1) {
        // Editing: keep the original add-only fields (registration / fitness dates)
        vehicles[idx] = {
          ...vehicles[idx],
          ownerName: body.ownerName,
          plate: body.plate,
          vType: body.vType,
          insuranceDate: body.insuranceDate,
          pollutionDate: body.pollutionDate
        };
      } else {
        vehicles.push(body);
      }

      await redis.set(KEY, vehicles);
      return res.status(200).json(vehicles);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Missing id query parameter.' });

      let vehicles = (await redis.get(KEY)) || [];
      vehicles = vehicles.filter((v) => v.id !== id);

      await redis.set(KEY, vehicles);
      return res.status(200).json(vehicles);
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('vehicles API error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}