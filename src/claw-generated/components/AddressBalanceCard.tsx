import React, { useState, useEffect } from 'react';
import { getBalance } from '../rpc/getBalance';

interface AddressBalanceCardProps {
  address: string;
}

const AddressBalanceCard: React.FC<AddressBalanceCardProps> = ({ address }) => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      const balance = await getBalance(address);
      setBalance(balance);
    };
    fetchBalance();
  }, [address]);

  return (
    <div>
      <h3>Address Balance</h3>
      <p>Balance: {balance} tokens</p>
    </div>
  );
};

export default AddressBalanceCard;