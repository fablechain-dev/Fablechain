import React, { useEffect, useState } from 'react';
import { Transaction } from '../transaction/Transaction';
import { TransactionFeedManager } from '../transaction/TransactionFeedManager';

interface TransactionFeedProps {
  transactionFeedManager: TransactionFeedManager;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({ transactionFeedManager }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const subscription = transactionFeedManager.on('newTransaction', (tx: Transaction) => {
      setTransactions((prevTransactions) => [...prevTransactions, tx]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [transactionFeedManager]);

  return (
    <div>
      <h2>Real-Time Transaction Feed</h2>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            <strong>Transaction Hash:</strong> {tx.hash}
          </li>
        ))}
      </ul>
    </div>
  );
};