import React, { useState } from 'react';
import WalletConnectModal from './WalletConnectModal';
import { useWallet } from './useWallet';

const WalletConnectionPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentAddress, currentWalletType } = useWallet();

  const handleWalletConnect = (address: string, provider: any, walletType: 'ethereum' | 'solana') => {
    // Perform any additional logic after wallet connection
  };

  const handleWalletDisconnect = () => {
    // Handle wallet disconnection
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <h1>Connect Wallet</h1>
      {currentAddress ? (
        <div>
          <p>Connected to: {currentAddress} ({currentWalletType})</p>
          <button onClick={handleOpenModal}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleOpenModal}>Connect Wallet</button>
      )}
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onWalletConnected={handleWalletConnect}
        onWalletDisconnected={handleWalletDisconnect}
        connectedAddress={currentAddress}
        connectedWalletType={currentWalletType}
      />
    </div>
  );
};

export default WalletConnectionPage;