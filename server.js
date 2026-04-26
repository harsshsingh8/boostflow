import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Internal SMM Panel
import { handleRequest as handleSMMRequest, API_KEY as SMM_PANEL_KEY } from './backend/smm-panel/api.js';
import { getAllOrders, getServices } from './backend/smm-panel/store.js';
import { getStatus } from './backend/smm-panel/engine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'internal-smm-panel',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// FRONTEND BRIDGE ENDPOINT
// ============================================
app.post('/api/order', async (req, res) => {
  try {
    const { link, quantity } = req.body;

    if (!link || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields: link and quantity are required',
      });
    }

    // Validate Instagram link
    if (!link.includes('instagram.com')) {
      return res.status(400).json({
        error: 'Invalid Link',
        message: 'Please provide a valid Instagram Reel URL',
      });
    }

    const EXTERNAL_SMM_URL = process.env.SMM_API_URL;
    const EXTERNAL_SMM_KEY = process.env.SMM_API_KEY;
    const EXTERNAL_SMM_SERVICE = process.env.SMM_SERVICE_ID;

    // Prefer external provider if configured
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

      return res.json({
        order: 'N/A',
        rawResponse: data,
        message: 'Order submitted but response format was unexpected',
      });
    }

    // INTERNAL SMM PANEL (built-in)
    const result = await handleSMMRequest({
      key: SMM_PANEL_KEY,
      action: 'add',
      service: 1, // Instagram Views
      link,
      quantity: parseInt(quantity, 10),
      runs: 12,
      interval: 5,
    });

    if (result.error) {
      return res.status(400).json({
        error: result.error,
        message: 'The SMM panel rejected this request.',
      });
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
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The provider took too long to respond. Please try again.',
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'Provider Error',
        message: error.response.data?.error || error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong while processing your order. Please try again.',
    });
  }
});

// ============================================
// RAW SMM PANEL API (external tools can call this)
// ============================================
app.post('/api/v2', async (req, res) => {
  const result = await handleSMMRequest(req.body);
  res.json(result);
});

// SMM Panel: Get order status
app.get('/api/v2', async (req, res) => {
  const { key, action, order } = req.query;
  const result = await handleSMMRequest({ key, action, order });
  res.json(result);
});

// ============================================
// ADMIN / DASHBOARD ENDPOINTS
// ============================================
app.get('/api/admin/orders', (req, res) => {
  res.json(getAllOrders());
});

app.get('/api/admin/orders/:id', (req, res) => {
  const status = getStatus(parseInt(req.params.id, 10));
  if (!status) return res.status(404).json({ error: 'Order not found' });
  res.json(status);
});

app.get('/api/admin/services', (req, res) => {
  res.json(getServices());
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`BoostFlow API Server running on http://localhost:${PORT}`);
  console.log(`SMM Panel Mode: INTERNAL (built-in)`);
  console.log(`External Provider: ${process.env.SMM_API_KEY ? 'Configured (will be preferred)' : 'Not configured'}`);
  console.log(`Raw SMM API: POST http://localhost:${PORT}/api/v2`);
  console.log(`Admin Orders: GET http://localhost:${PORT}/api/admin/orders`);
});
