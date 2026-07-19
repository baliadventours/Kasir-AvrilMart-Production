import { useState, useEffect } from 'react';

export interface QueuedTransaction {
  id: string;
  type: 'sale' | 'product_add' | 'product_update' | 'product_delete';
  data: any;
  timestamp: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed';
}

const QUEUE_KEY = 'offline_transaction_queue';
const MAX_ATTEMPTS = 3;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  // Load queue from localStorage
  const getQueue = (): QueuedTransaction[] => {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save queue to localStorage
  const saveQueue = (queue: QueuedTransaction[]) => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setQueuedCount(queue.filter(t => t.status === 'pending').length);
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  };

  // Add transaction to queue
  const addToQueue = (
    type: QueuedTransaction['type'],
    data: any
  ): string => {
    const transaction: QueuedTransaction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      attempts: 0,
      status: 'pending',
    };

    const queue = getQueue();
    queue.push(transaction);
    saveQueue(queue);
    
    return transaction.id;
  };

  // Remove transaction from queue
  const removeFromQueue = (id: string) => {
    const queue = getQueue();
    const updated = queue.filter(t => t.id !== id);
    saveQueue(updated);
  };

  // Update transaction status
  const updateTransactionStatus = (
    id: string,
    status: QueuedTransaction['status'],
    incrementAttempts = false
  ) => {
    const queue = getQueue();
    const updated = queue.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status,
          attempts: incrementAttempts ? t.attempts + 1 : t.attempts,
        };
      }
      return t;
    });
    saveQueue(updated);
  };

  // Sync queue with server
  const syncQueue = async (
    onSale: (items: any[], total: number, priceType: any, paymentAmount?: number) => Promise<void>,
    onAddProduct: (product: any) => Promise<void>,
    onUpdateProduct: (id: string, product: any) => Promise<void>,
    onDeleteProduct: (id: string) => Promise<void>
  ) => {
    if (!isOnline || isSyncing) return;

    const queue = getQueue();
    const pendingTransactions = queue.filter(
      t => t.status === 'pending' && t.attempts < MAX_ATTEMPTS
    );

    if (pendingTransactions.length === 0) return;

    setIsSyncing(true);
    console.log(`🔄 Syncing ${pendingTransactions.length} queued transactions...`);

    for (const transaction of pendingTransactions) {
      try {
        updateTransactionStatus(transaction.id, 'syncing', true);

        switch (transaction.type) {
          case 'sale':
            await onSale(
              transaction.data.items,
              transaction.data.total,
              transaction.data.priceType,
              transaction.data.paymentAmount
            );
            break;
          case 'product_add':
            await onAddProduct(transaction.data);
            break;
          case 'product_update':
            await onUpdateProduct(transaction.data.id, transaction.data.product);
            break;
          case 'product_delete':
            await onDeleteProduct(transaction.data.id);
            break;
        }

        removeFromQueue(transaction.id);
        console.log(`✅ Synced transaction: ${transaction.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync transaction ${transaction.id}:`, error);
        
        if (transaction.attempts >= MAX_ATTEMPTS - 1) {
          updateTransactionStatus(transaction.id, 'failed');
        } else {
          updateTransactionStatus(transaction.id, 'pending');
        }
      }
    }

    setIsSyncing(false);
    setQueuedCount(getQueue().filter(t => t.status === 'pending').length);
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online!');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📡 Offline mode activated');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queued count on mount
    setQueuedCount(getQueue().filter(t => t.status === 'pending').length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Clear failed transactions
  const clearFailedTransactions = () => {
    const queue = getQueue();
    const updated = queue.filter(t => t.status !== 'failed');
    saveQueue(updated);
  };

  // Get failed transactions
  const getFailedTransactions = (): QueuedTransaction[] => {
    return getQueue().filter(t => t.status === 'failed');
  };

  // Retry failed transaction
  const retryTransaction = (id: string) => {
    updateTransactionStatus(id, 'pending');
  };

  return {
    isOnline,
    isSyncing,
    queuedCount,
    addToQueue,
    removeFromQueue,
    syncQueue,
    getQueue,
    clearFailedTransactions,
    getFailedTransactions,
    retryTransaction,
  };
}
