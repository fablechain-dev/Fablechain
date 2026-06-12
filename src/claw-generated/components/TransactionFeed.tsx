import React, { useState, useEffect } from 'react';
import { Transaction } from '../transaction';

interface TransactionFeedProps {
  maxTransactions?: number;
}

const TransactionFeed: React.FC<TransactionFeedProps> = ({ maxTransactions = 20 }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/transactions/feed');
    eventSource.onmessage = (event) => {
      const newTransaction = JSON.parse(event.data) as Transaction;
      setTransactions((prevTransactions) => [newTransaction, ...prevTransactions].slice(0, maxTransactions));
    };

    return () => {
      eventSource.close();
    };
  }, [maxTransactions]);

  return (
    <div className="transaction-feed">
      <h2>Live Transaction Feed</h2>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            <div>
              <strong>Tx Hash:</strong> {tx.hash}
            </div>
            <div>
              <strong>From:</strong> {tx.from}
            </div>
            <div>
              <strong>To:</strong> {tx.to}
            </div>
            <div>
              <strong>Value:</strong> {tx.value} CLAW
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionFeed;