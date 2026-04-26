import { createPayPalOrder } from '../../backend/paypal.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { price, label, link, quantity } = req.body;
    if (!price || !label || !link || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = await createPayPalOrder({ price, label, link, quantity });
    res.json({ orderId: order.id });
  } catch (err) {
    console.error('PayPal Create Order Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create PayPal order' });
  }
}
