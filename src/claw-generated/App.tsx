import React, { useState } from 'react';
import WalletConnectModal from './WalletConnectModal';

const App: React.FC = () => {
  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(undefined);
  const [connectedWalletType, setConnectedWalletType] = useState<'ethereum' | 'solana' | undefined>(undefined);

  const handleWalletConnected = (address: string, provider: any, walletType: 'ethereum' | 'solana') => {
    setConnectedAddress(address);
    setConnectedWalletType(walletType);
    setIsWalletConnectModalOpen(false);
  };

  const handleWalletDisconnected = () => {
    setConnectedAddress(undefined);
    setConnectedWalletType(undefined);
  };

  const openWalletConnectModal = () => {
    setIsWalletConnectModalOpen(true);
  };

  const closeWalletConnectModal = () => {
    setIsWalletConnectModalOpen(false);
  };

  return (
    <div className="app-container">
      <header>
        <nav>
          <ul>
            <li>
              <button onClick={openWalletConnectModal}>
                {connectedAddress
                  ? `Connected: ${connectedWalletType === 'ethereum' ? '🦊' : '👻'} ${connectedAddress}`
                  : 'Connect Wallet'}
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        {/* Your app content goes here */}
      </main>

      <WalletConnectModal
        isOpen={isWalletConnectModalOpen}
        onClose={closeWalletConnectModal}
        onWalletConnected={handleWalletConnected}
        onWalletDisconnected={handleWalletDisconnected}
        connectedAddress={connectedAddress}
        connectedWalletType={connectedWalletType}
      />
    </div>
  );
};

export default App;