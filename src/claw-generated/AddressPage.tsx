import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAddressBalance, getAddressTransactions, getAddressTokens } from '../api/address';

const AddressPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchAddressData = async () => {
      setBalance(await getAddressBalance(address));
      setTransactions(await getAddressTransactions(address));
      setTokens(await getAddressTokens(address));
    };
    fetchAddressData();
  }, [address]);

  return (
    <div>
      <h1>Address: {address}</h1>
      <p>Balance: {balance} CLAW</p>
      <h2>Transactions</h2>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            {tx.type} - {tx.amount} CLAW
          </li>
        ))}
      </ul>
      <h2>Token Holdings</h2>
      <ul>
        {tokens.map((token) => (
          <li key={token.id}>
            {token.name} - {token.balance}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressPage;