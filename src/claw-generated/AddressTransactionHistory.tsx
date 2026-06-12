import React from 'react';

interface AddressTransactionHistoryProps {
  transactions: any[];
}

const AddressTransactionHistory: React.FC<AddressTransactionHistoryProps> = ({ transactions }) => {
  return (
    <div className="address-transaction-history">
      <h2>Transaction History</h2>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Block</th>
            <th>Date</th>
            <th>Value</th>
            <th>From</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={index}>
              <td>{tx.hash}</td>
              <td>{tx.block}</td>
              <td>{tx.timestamp}</td>
              <td>{tx.value} CLAW</td>
              <td>{tx.from}</td>
              <td>{tx.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddressTransactionHistory;