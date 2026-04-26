import { createOrder, getOrder, getServices } from './store.js';
import { startDelivery, getStatus } from './engine.js';

const API_KEY = process.env.SMM_PANEL_KEY || 'boostflow-local-key';

function validateKey(key) {
  return key === API_KEY;
}

/**
 * Handle SMM Panel API requests
 * Standard SMM panel format: POST with action parameter
 */
async function handleRequest(body) {
  const { key, action, ...params } = body;

  if (!validateKey(key)) {
    return { error: 'Invalid API key' };
  }

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'status':
      return handleStatus(params);
    case 'services':
      return handleServices();
    case 'balance':
      return handleBalance();
    default:
      return { error: 'Invalid action' };
  }
}

function handleAdd({ service, link, quantity, runs = 1, interval = 0 }) {
  if (!service || !link || !quantity) {
    return { error: 'Missing required fields: service, link, quantity' };
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 100) {
    return { error: 'Quantity must be at least 100' };
  }

  if (!link.includes('instagram.com') && !link.includes('http')) {
    return { error: 'Invalid link format' };
  }

  try {
    const order = createOrder({
      service: parseInt(service, 10),
      link,
      quantity: qty,
      runs: parseInt(runs, 10) || 1,
      interval: parseInt(interval, 10) || 0,
    });

    // Start background delivery
    startDelivery(order.id);

    return { order: order.id };
  } catch (err) {
    return { error: err.message || 'Failed to create order' };
  }
}

function handleStatus({ order }) {
  if (!order) {
    return { error: 'Missing order ID' };
  }

  const status = getStatus(parseInt(order, 10));
  if (!status) {
    return { error: 'Order not found' };
  }

  return status;
}

function handleServices() {
  return getServices();
}

function handleBalance() {
  return {
    balance: '9999.99',
    currency: 'USD',
  };
}

export { handleRequest, API_KEY };
