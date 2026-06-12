import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletModal: React.FC = () => {
  const { connectWallet, disconnectWallet, currentAccount } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async () => {
    await connectWallet();
    setIsOpen(false);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Connect Wallet</button>
      {isOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Connect Wallet</h2>
            {currentAccount ? (
              <div>
                <p>Connected account: {currentAccount}</p>
                <button onClick={handleDisconnect}>Disconnect</button>
              </div>
            ) : (
              <button onClick={handleConnect}>Connect to MetaMask</button>
            )}
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletModal;