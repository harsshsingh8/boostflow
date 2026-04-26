import { capturePayPalOrder } from '../../backend/paypal.js';
import { handleRequest as handleSMMRequest, API_KEY as SMM_PANEL_KEY } from '../../backend/smm-panel/api.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, link, quantity } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Missing PayPal order ID' });
    }

    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed', status: capture.status });
    }

    const smmResult = await handleSMMRequest({
      key: SMM_PANEL_KEY,
      action: 'add',
      service: 1,
      link,
      quantity: parseInt(quantity, 10),
      runs: 12,
      interval: 5,
    });

    if (smmResult.error) {
      return res.status(400).json({
        error: smmResult.error,
        message: 'Payment succeeded but SMM order failed. Contact support.',
        paypalOrderId: orderId,
      });
    }

    res.json({
      success: true,
      order: smmResult.order.toString(),
      paypalOrderId: orderId,
      mode: 'internal-smm-panel',
      message: 'Payment confirmed. Views transfer initiated!',
    });
  } catch (err) {
    console.error('PayPal Capture Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to capture payment' });
  }
}
