import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'orders.json');

// In-memory cache
let orders = [];
let lastId = 0;

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      orders = data.orders || [];
      lastId = data.lastId || 0;
    }
  } catch (err) {
    console.error('Failed to load orders DB:', err.message);
    orders = [];
    lastId = 0;
  }
}

function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify({ orders, lastId }, null, 2));
  } catch (err) {
    console.error('Failed to save orders DB:', err.message);
  }
}

function createOrder({ service, link, quantity, runs = 1, interval = 0 }) {
  lastId += 1;
  const now = new Date().toISOString();
  const order = {
    id: lastId,
    service,
    link,
    quantity: parseInt(quantity, 10),
    runs: parseInt(runs, 10),
    interval: parseInt(interval, 10),
    status: 'pending',
    progress: 0,
    batchesDelivered: 0,
    totalBatches: parseInt(runs, 10),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    logs: [`[${now}] Order created. Quantity: ${quantity}, Runs: ${runs}, Interval: ${interval}min`],
  };
  orders.push(order);
  save();
  return order;
}

function getOrder(id) {
  return orders.find((o) => o.id === parseInt(id, 10));
}

function updateOrder(id, updates) {
  const order = getOrder(id);
  if (!order) return null;
  Object.assign(order, updates, { updatedAt: new Date().toISOString() });
  save();
  return order;
}

function addLog(id, message) {
  const order = getOrder(id);
  if (order) {
    order.logs.push(`[${new Date().toISOString()}] ${message}`);
    save();
  }
}

function getAllOrders() {
  return [...orders];
}

function getServices() {
  return [
    { service: 1, name: 'Instagram Views', type: 'Default', category: 'Instagram', rate: '0.50', min: '100', max: '1000000', dripfeed: true },
    { service: 2, name: 'Instagram Likes', type: 'Default', category: 'Instagram', rate: '0.30', min: '50', max: '50000', dripfeed: false },
    { service: 3, name: 'Instagram Followers', type: 'Default', category: 'Instagram', rate: '1.20', min: '100', max: '100000', dripfeed: true },
  ];
}

// Load on startup
load();

export { createOrder, getOrder, updateOrder, addLog, getAllOrders, getServices, save };
