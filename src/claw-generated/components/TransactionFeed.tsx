import React, { useState, useEffect } from 'react';
import { Transaction } from '../Transaction';
import { TransactionPool } from '../TransactionPool';

interface TransactionFeedProps {
  transactionPool: TransactionPool;
}

const TransactionFeed: React.FC<TransactionFeedProps> = ({ transactionPool }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const subscription = transactionPool.subscribe((newTransactions: Transaction[]) => {
      setTransactions(newTransactions);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [transactionPool]);

  return (
    <div className="transaction-feed">
      <h2>Live Transaction Feed</h2>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            <div>
              <strong>Transaction:</strong> {tx.hash}
            </div>
            <div>
              <strong>From:</strong> {tx.from}
            </div>
            <div>
              <strong>To:</strong> {tx.to}
            </div>
            <div>
              <strong>Value:</strong> {tx.value} CLC
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionFeed;