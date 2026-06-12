import React from 'react';
import AddressBalanceCard from '../components/AddressBalanceCard';
import AddressTransactionHistory from '../components/AddressTransactionHistory';

interface AddressPageProps {
  address: string;
}

const AddressPage: React.FC<AddressPageProps> = ({ address }) => {
  return (
    <div>
      <h1>Address: {address}</h1>
      <AddressBalanceCard address={address} />
      <AddressTransactionHistory address={address} />
    </div>
  );
};

export default AddressPage;