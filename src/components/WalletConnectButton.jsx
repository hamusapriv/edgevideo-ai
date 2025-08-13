// src/components/WalletConnectButton.jsx
import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";

export default function WalletConnectButton({
  className = "",
  showAddress = true,
}) {
  const { user } = useAuth();
  const {
    wallet,
    connectWallet,
    verifyWallet,
    disconnectWallet,
    loading,
    error,
  } = useWallet();

  // Don't show wallet connection if user is not authenticated
  if (!user) {
    return null;
  }

  // Show install MetaMask message if not available
  if (!wallet.hasMetaMask) {
    return (
      <div className={`wallet-connect-container ${className}`}>
        <div className="wallet-install-prompt">
          <p>MetaMask is required to connect your wallet</p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="install-metamask-btn"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`wallet-connect-container ${className}`}>
      {error && (
        <div className="wallet-error">
          <p>{error}</p>
        </div>
      )}

      {!wallet.isConnected ? (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="wallet-connect-btn"
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <div className="wallet-connected">
          {showAddress && (
            <div className="wallet-address">
              <span className="address-label">Connected:</span>
              <span className="address-value">{wallet.shortAddress}</span>
            </div>
          )}
          <div className="wallet-actions">
            <button
              onClick={verifyWallet}
              disabled={true}
              className="wallet-verify-btn"
              title="Verification temporarily disabled - backend endpoints needed"
            >
              Verify Ownership (Coming Soon)
            </button>
            <button
              onClick={disconnectWallet}
              className="wallet-disconnect-btn"
              title="Disconnect wallet from this app (you'll remain connected in MetaMask)"
            >
              Disconnect from App
            </button>
          </div>
          <div className="wallet-info">
            <small>
              💡 To fully disconnect, go to MetaMask → Connected sites →
              Disconnect
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
