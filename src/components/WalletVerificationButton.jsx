import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import rainbowKitWalletService from "../services/rainbowKitWalletService";
import { useAuth } from "../contexts/AuthContext";

const WalletVerificationButton = ({ onVerificationComplete }) => {
  const { address, isConnected, chainId } = useAccount();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [linkedWallet, setLinkedWallet] = useState(null);
  const [error, setError] = useState(null);

  // Check wallet link status on component mount and when wallet changes
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      checkWalletLinkStatus();
    }
  }, [isAuthenticated, isConnected, address]);

  const checkWalletLinkStatus = async () => {
    try {
      const status = await rainbowKitWalletService.isWalletLinked();
      setLinkedWallet(status);

      if (status.blockReason) {
        setError(`Wallet blocked: ${status.blockReason}`);
      } else {
        setError(null);
      }
    } catch (error) {
      console.error("Failed to check wallet status:", error);
      setError("Failed to check wallet status");
    }
  };

  const handleVerifyOwnership = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await rainbowKitWalletService.verifyWalletOwnership();

      setVerificationStatus({
        success: true,
        walletAddress: result.walletAddress,
        message: "Wallet successfully verified and linked!",
      });

      // Refresh wallet link status
      await checkWalletLinkStatus();

      // Call callback if provided
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
    } catch (error) {
      console.error("Wallet verification failed:", error);
      setError(error.message);
      setVerificationStatus({
        success: false,
        message: error.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Don't show if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="wallet-verification-notice">
        <p>Please log in to verify wallet ownership</p>
      </div>
    );
  }

  // Don't show if wallet is not connected
  if (!isConnected) {
    return (
      <div className="wallet-verification-notice">
        <p>Please connect your wallet to verify ownership</p>
      </div>
    );
  }

  // Show if wallet is blocked
  if (linkedWallet?.blockReason) {
    return (
      <div className="wallet-verification-error">
        <h4>Wallet Blocked</h4>
        <p>{linkedWallet.blockReason}</p>
      </div>
    );
  }

  // Show if wallet is already linked
  if (linkedWallet?.isCurrentWalletLinked) {
    return (
      <div className="wallet-verification-success">
        <h4>✅ Wallet Verified</h4>
        <p>Your wallet {address} is verified and linked to your account.</p>
      </div>
    );
  }

  // Show if a different wallet is linked
  if (linkedWallet?.isLinked && !linkedWallet?.isCurrentWalletLinked) {
    return (
      <div className="wallet-verification-warning">
        <h4>⚠️ Different Wallet Linked</h4>
        <p>
          Another wallet ({linkedWallet.linkedAddress}) is already linked to
          your account.
        </p>
        <p>Current wallet: {address}</p>
        <button
          onClick={handleVerifyOwnership}
          disabled={isVerifying}
          className="btn btn-primary"
        >
          {isVerifying ? "Verifying..." : "Link This Wallet Instead"}
        </button>
      </div>
    );
  }

  // Show verification button for new wallet
  return (
    <div className="wallet-verification-container">
      <div className="wallet-verification-info">
        <h4>Verify Wallet Ownership</h4>
        <p>
          Link your wallet to your account using Sign-In with Ethereum (SIWE)
        </p>
        <div className="wallet-details">
          <p>
            <strong>Connected Wallet:</strong> {address}
          </p>
          <p>
            <strong>Network:</strong>{" "}
            {chainId === 137
              ? "Polygon ✅"
              : `Chain ${chainId} (will switch to Polygon)`}
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {verificationStatus && (
        <div
          className={`verification-result ${
            verificationStatus.success ? "success" : "error"
          }`}
        >
          <p>
            {verificationStatus.success ? "✅" : "❌"}{" "}
            {verificationStatus.message}
          </p>
        </div>
      )}

      <button
        onClick={handleVerifyOwnership}
        disabled={isVerifying}
        className="btn btn-primary verify-ownership-btn"
      >
        {isVerifying ? (
          <>
            <span className="spinner"></span>
            Verifying Ownership...
          </>
        ) : (
          "Verify Ownership"
        )}
      </button>

      <div className="verification-steps">
        <h5>Verification Process:</h5>
        <ol>
          <li>Switch to Polygon network (if needed)</li>
          <li>Sign a secure message with your wallet</li>
          <li>Link verified wallet to your account</li>
        </ol>
      </div>
    </div>
  );
};

export default WalletVerificationButton;
