import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAddressBalance, getAddressTransactions, getAddressTokens } from './explorer';

const AddressPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [balance, setBalance] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const balanceResult = await getAddressBalance(address);
      setBalance(balanceResult.balance);

      const transactionsResult = await getAddressTransactions(address);
      setTransactions(transactionsResult.transactions);

      const tokensResult = await getAddressTokens(address);
      setTokens(tokensResult.tokens);
    };
    fetchData();
  }, [address]);

  return (
    <div>
      <h1>Address: {address}</h1>
      <p>Balance: {balance} ETH</p>
      <h2>Transactions</h2>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.hash}>
            <a href={`/tx/${tx.hash}`}>{tx.hash}</a>
          </li>
        ))}
      </ul>
      <h2>Tokens</h2>
      <ul>
        {tokens.map((token) => (
          <li key={token.address}>
            {token.symbol}: {token.balance}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressPage;