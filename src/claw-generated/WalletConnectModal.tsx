import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected: (address: string, provider: any, walletType: 'ethereum' | 'solana') => void;
  onWalletDisconnected: () => void;
  connectedAddress?: string;
  connectedWalletType?: 'ethereum' | 'solana';
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  onWalletConnected,
  onWalletDisconnected,
  connectedAddress,
  connectedWalletType
}) => {
  const [showModal, setShowModal] = useState(isOpen);
  const { connectWallet, disconnectWallet, currentWalletType, currentAddress } = useWallet();

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleConnect = async () => {
    try {
      const { address, provider, walletType } = await connectWallet();
      onWalletConnected(address, provider, walletType);
      handleClose();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      onWalletDisconnected();
      handleClose();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    onClose();
  };

  return (
    <div className={`wallet-connect-modal ${showModal ? 'open' : ''}`}>
      <div className="modal-overlay" onClick={handleClose}></div>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={handleClose}>
          &times;
        </button>
        {connectedAddress ? (
          <div>
            <p>Connected to: {connectedAddress}</p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        ) : (
          <button onClick={handleConnect}>Connect Wallet</button>
        )}
      </div>
    </div>
  );
};

export default WalletConnectModal;