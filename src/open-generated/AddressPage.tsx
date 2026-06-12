import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAccountBalance, getTransactionHistory, getTokenHoldings } from './accounts';

const AddressPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setBalance(await getAccountBalance(address));
      setTransactions(await getTransactionHistory(address));
      setTokens(await getTokenHoldings(address));
    };
    fetchData();
  }, [address]);

  return (
    <div>
      <h1>Address: {address}</h1>
      <div>
        <h2>Balance: {balance} OPEN</h2>
        <h3>Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index}>
                <td>{tx.date}</td>
                <td>{tx.type}</td>
                <td>{tx.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Token Holdings</h3>
        <ul>
          {tokens.map((token, index) => (
            <li key={index}>{token.name}: {token.balance}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddressPage;