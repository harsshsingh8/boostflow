import { handleRequest as handleSMMRequest } from '../backend/smm-panel/api.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const result = await handleSMMRequest(req.body);
      return res.json(result);
    }

    if (req.method === 'GET') {
      const { key, action, order } = req.query;
      const result = await handleSMMRequest({ key, action, order });
      return res.json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('SMM API Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
