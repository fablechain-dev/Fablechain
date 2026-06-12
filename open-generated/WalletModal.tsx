import React, { useState } from 'react';
import { ethers } from 'ethers';

interface WalletModalProps {
  onConnect: (address: string) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ onConnect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const connectToMetaMask = async () => {
    setIsConnecting(true);
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request access to the user's MetaMask account
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Get the user's Ethereum address
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const address = accounts[0];

      // Store the connected account and notify the parent component
      setCurrentAccount(address);
      onConnect(address);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    } finally {
      setIsConnecting(false);
      setIsOpen(false);
    }
  };

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button onClick={toggleModal}>Connect Wallet</button>
      {isOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Connect Wallet</h2>
            {isConnecting ? (
              <div>Connecting...</div>
            ) : (
              <button onClick={connectToMetaMask}>Connect with MetaMask</button>
            )}
            <button onClick={toggleModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletModal;