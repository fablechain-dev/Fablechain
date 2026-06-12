import React, { useState } from 'react';
import MultiWalletConnect from '../frontend/src/MultiWalletConnect';

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
        <MultiWalletConnect
          onWalletConnected={onWalletConnected}
          onWalletDisconnected={onWalletDisconnected}
          connectedAddress={connectedAddress}
          connectedWalletType={connectedWalletType}
        />
      </div>
    </div>
  );
};

export default WalletConnectModal;