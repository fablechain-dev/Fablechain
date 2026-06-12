import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAddressBalance, getAddressTransactions, getAddressTokens } from '../api/blockchain';

const AddressPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    const fetchAddressData = async () => {
      const balanceResult = await getAddressBalance(address);
      setBalance(balanceResult.balance);

      const transactionsResult = await getAddressTransactions(address);
      setTransactions(transactionsResult.transactions);

      const tokensResult = await getAddressTokens(address);
      setTokens(tokensResult.tokens);
    };

    fetchAddressData();
  }, [address]);

  return (
    <div>
      <h1>Address: {address}</h1>
      <p>Balance: {balance} CLAW</p>
      <h2>Transactions</h2>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            <p>TX Hash: {tx.hash}</p>
            <p>Amount: {tx.amount} CLAW</p>
            <p>Date: {tx.timestamp}</p>
          </li>
        ))}
      </ul>
      <h2>Tokens</h2>
      <ul>
        {tokens.map((token, index) => (
          <li key={index}>
            <p>Token: {token.name}</p>
            <p>Balance: {token.balance}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressPage;