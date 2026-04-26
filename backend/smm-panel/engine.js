import { getOrder, updateOrder, addLog } from './store.js';

const activeTimers = new Map();

/**
 * Start the drip-feed delivery engine for an order
 * @param {number} orderId
 */
function startDelivery(orderId) {
  const order = getOrder(orderId);
  if (!order) return;

  // Mark as in progress
  updateOrder(orderId, { status: 'inprogress' });
  addLog(orderId, 'Delivery engine started. Drip-feed protocol active.');

  const { runs, interval, quantity } = order;
  const intervalMs = interval * 60 * 1000;
  const baseBatchSize = Math.floor(quantity / runs);
  const remainder = quantity % runs;

  let currentBatch = 0;

  const runBatch = () => {
    const o = getOrder(orderId);
    if (!o || o.status === 'canceled') {
      cleanup(orderId);
      return;
    }

    currentBatch += 1;
    const batchSize = baseBatchSize + (currentBatch <= remainder ? 1 : 0);

    // Simulate API delivery latency
    setTimeout(() => {
      const updated = getOrder(orderId);
      if (!updated || updated.status === 'canceled') {
        cleanup(orderId);
        return;
      }

      const newBatchesDelivered = currentBatch;
      const newProgress = Math.round((currentBatch / runs) * 100);
      const isComplete = currentBatch >= runs;

      updateOrder(orderId, {
        batchesDelivered: newBatchesDelivered,
        progress: newProgress,
        status: isComplete ? 'completed' : 'inprogress',
        completedAt: isComplete ? new Date().toISOString() : null,
      });

      addLog(
        orderId,
        `Batch ${currentBatch}/${runs} delivered. +${batchSize.toLocaleString()} views. Progress: ${newProgress}%`
      );

      if (isComplete) {
        addLog(orderId, 'All batches delivered. Order completed.');
        cleanup(orderId);
        return;
      }

      // Schedule next batch
      const timer = setTimeout(runBatch, intervalMs);
      activeTimers.set(orderId, timer);
    }, 2000);
  };

  // Kick off first batch immediately
  runBatch();
}

/**
 * Cancel an active delivery
 * @param {number} orderId
 */
function cancelDelivery(orderId) {
  cleanup(orderId);
  const order = getOrder(orderId);
  if (order) {
    updateOrder(orderId, { status: 'canceled' });
    addLog(orderId, 'Delivery canceled by user or system.');
  }
}

/**
 * Clean up timers for an order
 * @param {number} orderId
 */
function cleanup(orderId) {
  if (activeTimers.has(orderId)) {
    clearTimeout(activeTimers.get(orderId));
    activeTimers.delete(orderId);
  }
}

/**
 * Get live status of an order
 * @param {number} orderId
 */
function getStatus(orderId) {
  const order = getOrder(orderId);
  if (!order) return null;

  return {
    order: order.id,
    service: order.service,
    link: order.link,
    quantity: order.quantity,
    status: order.status,
    runs: order.runs,
    interval: order.interval,
    progress: order.progress,
    batchesDelivered: order.batchesDelivered,
    totalBatches: order.totalBatches,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
  };
}

export { startDelivery, cancelDelivery, getStatus };
