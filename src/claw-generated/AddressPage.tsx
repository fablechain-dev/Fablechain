import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAddressBalance, getAddressTransactions, getAddressTokens } from '../api/address';
import AddressBalanceCard from './AddressBalanceCard';
import AddressTransactionHistory from './AddressTransactionHistory';
import AddressTokenHoldings from './AddressTokenHoldings';

const AddressPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [balance, setBalance] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    const fetchAddressData = async () => {
      const balanceResponse = await getAddressBalance(address);
      setBalance(balanceResponse.balance);

      const transactionsResponse = await getAddressTransactions(address);
      setTransactions(transactionsResponse.transactions);

      const tokensResponse = await getAddressTokens(address);
      setTokens(tokensResponse.tokens);
    };

    fetchAddressData();
  }, [address]);

  return (
    <div className="address-page">
      <h1>Address: {address}</h1>
      <AddressBalanceCard balance={balance} />
      <AddressTransactionHistory transactions={transactions} />
      <AddressTokenHoldings tokens={tokens} />
    </div>
  );
};

export default AddressPage;