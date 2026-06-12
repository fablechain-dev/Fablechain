import React, { useState, useEffect } from 'react';
import { getTransactions } from '../rpc/getTransactions';
import { Transaction } from '../transaction/transaction';

interface AddressTransactionHistoryProps {
  address: string;
}

const AddressTransactionHistory: React.FC<AddressTransactionHistoryProps> = ({ address }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const txs = await getTransactions(address);
      setTransactions(txs);
    };
    fetchTransactions();
  }, [address]);

  return (
    <div>
      <h3>Transaction History</h3>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Block</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.hash}>
              <td>{tx.hash}</td>
              <td>{tx.blockNumber}</td>
              <td>{tx.from}</td>
              <td>{tx.to}</td>
              <td>{tx.amount}</td>
              <td>{tx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddressTransactionHistory;