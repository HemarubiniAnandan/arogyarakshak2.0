/**
 * Stock Freshness Engine — Classifies stock data by last-update recency
 * 
 * Fresh:  < 4 hours since last_updated
 * Aging:  4–24 hours since last_updated
 * Stale:  > 24 hours — UI must require re-confirmation before recommending facility
 */

/**
 * Classify a single stock item's freshness
 * @param {string} lastUpdated - ISO datetime string of last stock update
 * @param {Date} [now] - Current time (injectable for testing)
 * @returns {Object} { freshness, hours_since_update, requires_reconfirmation, label }
 */
function classifyFreshness(lastUpdated, now = new Date()) {
  if (!lastUpdated) {
    return {
      freshness: 'unknown',
      hours_since_update: null,
      requires_reconfirmation: true,
      label: 'No update timestamp — requires manual verification',
    };
  }

  const updated = new Date(lastUpdated);
  const diffMs = now - updated;
  const hours = diffMs / (1000 * 60 * 60);

  if (hours < 4) {
    return {
      freshness: 'fresh',
      hours_since_update: Math.round(hours * 10) / 10,
      requires_reconfirmation: false,
      label: `Updated ${formatTimeSince(hours)} ago — data is current`,
    };
  }

  if (hours < 24) {
    return {
      freshness: 'aging',
      hours_since_update: Math.round(hours * 10) / 10,
      requires_reconfirmation: false,
      label: `Updated ${formatTimeSince(hours)} ago — data may be slightly outdated`,
    };
  }

  return {
    freshness: 'stale',
    hours_since_update: Math.round(hours * 10) / 10,
    requires_reconfirmation: true,
    label: `Updated ${formatTimeSince(hours)} ago — requires re-confirmation before use`,
  };
}

/**
 * Classify a batch of stock items
 * @param {Array} stockItems - Array of stock records with last_updated field
 * @returns {Array} Same items with freshness data appended
 */
function classifyBatch(stockItems, now = new Date()) {
  return stockItems.map(item => ({
    ...item,
    ...classifyFreshness(item.last_updated, now),
  }));
}

/**
 * Check if a facility's stock should be trusted for recommendations
 * @param {Array} stockItems - Stock items for one facility
 * @returns {Object} { trustworthy, stale_count, total_count, recommendation }
 */
function assessFacilityStockTrust(stockItems, now = new Date()) {
  const classified = classifyBatch(stockItems, now);
  const staleCount = classified.filter(i => i.freshness === 'stale' || i.freshness === 'unknown').length;
  const total = classified.length;
  const staleRatio = total > 0 ? staleCount / total : 1;

  return {
    trustworthy: staleRatio < 0.5,
    stale_count: staleCount,
    total_count: total,
    stale_ratio: Math.round(staleRatio * 100),
    recommendation: staleRatio >= 0.5
      ? 'Over 50% of stock data is stale — facility staff should update inventory before this facility is recommended'
      : staleCount > 0
        ? `${staleCount} of ${total} items have stale data — partial re-confirmation recommended`
        : 'All stock data is current',
  };
}

function formatTimeSince(hours) {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} hour${h !== 1 ? 's' : ''}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

module.exports = { classifyFreshness, classifyBatch, assessFacilityStockTrust };
