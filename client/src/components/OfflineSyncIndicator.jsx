import React, { useState, useEffect } from 'react';
import { getOfflineQueue, flushOfflineQueue } from '../utils/offlineQueue';

export default function OfflineSyncIndicator({ userToken }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      autoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [userToken]);

  const checkQueue = async () => {
    try {
      const queue = await getOfflineQueue();
      setPendingCount(queue ? queue.length : 0);
    } catch (e) {
      // ignore
    }
  };

  const autoSync = async () => {
    if (!userToken) return;
    setSyncing(true);
    await flushOfflineQueue(userToken);
    await checkQueue();
    setSyncing(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: isOnline ? '#28A745' : '#DC3545',
        fontWeight: 'bold',
      }}>
        <span style={{
          height: '8px',
          width: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#28A745' : '#DC3545',
        }}></span>
        {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
      </span>

      {pendingCount > 0 && (
        <button
          onClick={autoSync}
          disabled={!isOnline || syncing}
          className="gov-btn gov-btn-secondary"
          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
        >
          {syncing ? 'Syncing...' : `${pendingCount} Pending Sync`}
        </button>
      )}
    </div>
  );
}
