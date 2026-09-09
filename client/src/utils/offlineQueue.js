import { openDB } from 'idb';

const DB_NAME = 'AarogyaRakshakOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_queue';

export async function initOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function enqueueOfflineAction(actionType, tableName, recordId, data) {
  const db = await initOfflineDB();
  const item = {
    table_name: tableName,
    record_id: recordId,
    action: actionType,
    data,
    client_timestamp: new Date().toISOString(),
  };
  await db.add(STORE_NAME, item);
  console.log('[OFFLINE QUEUE] Action enqueued:', item);
  return item;
}

export async function getOfflineQueue() {
  const db = await initOfflineDB();
  return db.getAll(STORE_NAME);
}

export async function clearOfflineQueue() {
  const db = await initOfflineDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done();
}

export async function flushOfflineQueue(token) {
  const queue = await getOfflineQueue();
  if (!queue || queue.length === 0) return { synced: 0, results: [] };

  try {
    const response = await fetch('http://localhost:3001/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ items: queue }),
    });

    if (response.ok) {
      const data = await response.json();
      await clearOfflineQueue();
      return data;
    }
  } catch (err) {
    console.warn('[OFFLINE QUEUE] Sync attempt failed (server unreachable):', err.message);
  }
  return { synced: 0, results: [] };
}
