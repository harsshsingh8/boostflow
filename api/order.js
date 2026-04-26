import axios from 'axios';
import { handleRequest as handleSMMRequest, API_KEY as SMM_PANEL_KEY } from '../backend/smm-panel/api.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { link, quantity } = req.body;

    if (!link || !quantity) {
      return res.status(400).json({ error: 'Missing required fields: link and quantity are required' });
    }

    if (!link.includes('instagram.com')) {
      return res.status(400).json({ error: 'Invalid Link', message: 'Please provide a valid Instagram Reel URL' });
    }

    const EXTERNAL_SMM_URL = process.env.SMM_API_URL;
    const EXTERNAL_SMM_KEY = process.env.SMM_API_KEY;
    const EXTERNAL_SMM_SERVICE = process.env.SMM_SERVICE_ID;

    if (EXTERNAL_SMM_URL && EXTERNAL_SMM_KEY && EXTERNAL_SMM_SERVICE) {
      const payload = {
        key: EXTERNAL_SMM_KEY,
        action: 'add',
        service: parseInt(EXTERNAL_SMM_SERVICE, 10),
        link,
        quantity: parseInt(quantity, 10),
        runs: 12,
        interval: 5,
      };

      const response = await axios.post(EXTERNAL_SMM_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      const data = response.data;

      if (data.error) {
        return res.status(400).json({
          error: data.error,
          message: 'The SMM provider rejected this request. Please check your link and try again.',
        });
      }

      if (data.order) {
        return res.json({
          order: data.order.toString(),
          link,
          quantity,
          runs: 12,
          interval: 5,
          mode: 'external-live',
          message: 'Transaction Confirmed',
        });
      }

      return res.json({ order: 'N/A', rawResponse: data, message: 'Order submitted but response format was unexpected' });
    }

    const result = await handleSMMRequest({
      key: SMM_PANEL_KEY,
      action: 'add',
      service: 1,
      link,
      quantity: parseInt(quantity, 10),
      runs: 12,
      interval: 5,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error, message: 'The SMM panel rejected this request.' });
    }

    return res.json({
      order: result.order.toString(),
      link,
      quantity,
      runs: 12,
      interval: 5,
      mode: 'internal-smm-panel',
      message: 'Transaction Confirmed',
    });
  } catch (error) {
    console.error('API Error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Gateway Timeout', message: 'The provider took too long to respond. Please try again.' });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'Provider Error',
        message: error.response.data?.error || error.message,
      });
    }

    return res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong while processing your order. Please try again.' });
  }
}
