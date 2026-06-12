import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAddressBalance, getAddressTransactions, getAddressTokens } from './api/blockchain';
import AddressBalanceCard from './AddressBalanceCard';
import AddressTokenHoldings from './AddressTokenHoldings';
import AddressTransactionHistory from './AddressTransactionHistory';

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
      <AddressBalanceCard balance={balance} />
      <AddressTokenHoldings tokens={tokens} />
      <AddressTransactionHistory transactions={transactions} />
    </div>
  );
};

export default AddressPage;