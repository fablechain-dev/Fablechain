import React, { useState, useEffect } from 'react';
import { useOpenChain } from '../useOpenChain';
import { Transaction } from '../transaction/transaction';
import { format } from 'date-fns';

const TransactionExplorer: React.FC = () => {
  const { getTransactions } = useOpenChain();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const txs = await getTransactions();
      setTransactions(txs);
    };
    fetchTransactions();
  }, [getTransactions]);

  return (
    <div>
      <h1>Transaction Explorer</h1>
      <table>
        <thead>
          <tr>
            <th>Tx Hash</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Timestamp</th>
            <th>Gas Used</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.hash}>
              <td>{tx.hash}</td>
              <td>{tx.from}</td>
              <td>{tx.to}</td>
              <td>{tx.amount}</td>
              <td>{format(tx.timestamp * 1000, 'yyyy-MM-dd HH:mm:ss')}</td>
              <td>{tx.gasUsed}</td>
              <td>{tx.status ? 'Success' : 'Failed'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionExplorer;