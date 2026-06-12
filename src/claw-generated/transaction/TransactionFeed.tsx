import React, { useState, useEffect } from 'react';
import { Transaction } from './transaction';
import { WebSocketConnection } from '../websocket';

interface TransactionFeedProps {
  walletAddress: Uint8Array;
}

const TransactionFeed: React.FC<TransactionFeedProps> = ({ walletAddress }) => {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [confirmedTransactions, setConfirmedTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'confirmed' | 'all'>('all');

  useEffect(() => {
    const ws = new WebSocketConnection('/transactions');
    ws.onMessage((data) => {
      const newTransaction = Transaction.fromJSON(data);
      if (
        newTransaction.senderAddress.toString() === walletAddress.toString() ||
        newTransaction.recipientAddress.toString() === walletAddress.toString()
      ) {
        if (newTransaction.status === 'pending') {
          setPendingTransactions((prevTransactions) => [newTransaction, ...prevTransactions]);
        } else {
          setConfirmedTransactions((prevTransactions) => [newTransaction, ...prevTransactions]);
        }
      }
    });

    return () => {
      ws.close();
    };
  }, [walletAddress]);

  const filteredTransactions = () => {
    switch (filterStatus) {
      case 'pending':
        return pendingTransactions;
      case 'confirmed':
        return confirmedTransactions;
      case 'all':
        return [...pendingTransactions, ...confirmedTransactions];
    }
  };

  return (
    <div className="transaction-feed">
      <h2>Real-Time Transaction Feed</h2>
      <div className="filter-buttons">
        <button onClick={() => setFilterStatus('pending')}>Pending</button>
        <button onClick={() => setFilterStatus('confirmed')}>Confirmed</button>
        <button onClick={() => setFilterStatus('all')}>All</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Sender</th>
            <th>Recipient</th>
            <th>Amount</th>
            <th>Fee</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions().map((tx, index) => (
            <tr key={index}>
              <td>{tx.senderAddress}</td>
              <td>{tx.recipientAddress}</td>
              <td>{tx.amount}</td>
              <td>{tx.fee}</td>
              <td>{tx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionFeed;