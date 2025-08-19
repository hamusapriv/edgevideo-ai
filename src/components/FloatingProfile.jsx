// src/components/FloatingProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import LogoutButton from "../auth/LogoutButton";
import WalletSvg from "./svgs/WalletSvg";
import rainbowKitWalletService from "../services/rainbowKitWalletService";

export default function FloatingProfile() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [isWalletLinked, setIsWalletLinked] = useState(false);
  const profileRef = useRef(null);
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const {
    wallet,
    connectWallet,
    verifyWallet,
    disconnectWallet,
    loading,
    error,
  } = useWallet();

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const copyAddress = async () => {
    if (wallet.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        // You could add a toast notification here
        console.log("Address copied to clipboard");
      } catch (err) {
        console.error("Failed to copy address:", err);
      }
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleVerifyWallet = async () => {
    if (!user) {
      setVerificationError("Please log in first to verify wallet ownership");
      return;
    }

    if (!isConnected || !address) {
      setVerificationError("Please connect your wallet first");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await rainbowKitWalletService.verifyWalletOwnership();
      console.log("Wallet verification successful:", result);

      // Update local state
      setIsWalletLinked(true);

      // You might want to update the wallet context here too
      // or trigger a refresh of wallet status
    } catch (error) {
      console.error("Wallet verification failed:", error);

      // Provide specific error messages based on the type of error
      let userMessage = error.message;

      if (error.message.includes("Internal server error")) {
        userMessage =
          "🔧 Backend service is being updated. Wallet verification will be available soon!";
      } else if (error.message.includes("500")) {
        userMessage =
          "⚠️ Server error occurred. Please try again in a few minutes.";
      } else if (error.message.includes("Failed to get nonce")) {
        userMessage =
          "🔄 Unable to start verification process. Backend service may be updating.";
      }

      setVerificationError(userMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  // Close profile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  // Check wallet link status when user/wallet changes
  useEffect(() => {
    const checkWalletLinkStatus = async () => {
      if (user && isConnected && address) {
        try {
          const status = await rainbowKitWalletService.isWalletLinked();
          setIsWalletLinked(status.isCurrentWalletLinked);
        } catch (error) {
          console.error("Failed to check wallet link status:", error);
          setIsWalletLinked(false);
        }
      } else {
        setIsWalletLinked(false);
      }
    };

    checkWalletLinkStatus();
  }, [user, isConnected, address]);

  return (
    <div className="floating-profile" ref={profileRef}>
      <button
        className={`profile-orb ${profileOpen ? "profile-orb--open" : ""}`}
        onClick={toggleProfile}
        aria-label="Toggle Profile"
      >
        <div className="orb-inner">
          {user ? (
            <div className="profile-avatar">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="profile-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div className="orb-glow"></div>
      </button>

      <div
        className={`profile-panel ${profileOpen ? "profile-panel--open" : ""}`}
      >
        {!user ? (
          <div className="profile-content">
            <div className="profile-section">
              <h3 style={{ marginBottom: "18px", color: "white" }}>Sign In</h3>
              <p style={{ marginBottom: "18px", color: "white" }}>
                Connect to access your profile and wallet
              </p>
              <GoogleSignInButton />
            </div>
          </div>
        ) : (
          <div className="profile-content">
            {/* Enhanced Profile Header */}
            <div className="profile-section profile-header">
              <div className="user-info">
                <div className="user-avatar-container">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "User"}
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                  <div className="status-indicator online"></div>
                </div>
                <div className="user-details">
                  <h3>{user.name || "User"}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Enhanced Wallet Section */}
            <div className="profile-section wallet-section">
              <div className="section-header">
                <div className="section-title">
                  <WalletSvg />
                  <h4>Wallet</h4>
                </div>
                {wallet.isConnected ? (
                  <span
                    className={`status-badge ${
                      wallet.isVerified ? "verified" : "connected"
                    }`}
                  >
                    {wallet.isVerified ? "✓ Verified" : "🔗 Connected"}
                  </span>
                ) : null}
              </div>

              {wallet.isConnected ? (
                <div className="wallet-connected-info">
                  <div className="wallet-address-card">
                    <div className="address-header">
                      <span className="address-label">Address</span>
                    </div>
                    <div className="address-value">
                      <span className="address-text">
                        {wallet.shortAddress}
                      </span>
                      <button
                        className="copy-address-btn"
                        title="Copy address"
                        onClick={copyAddress}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="wallet-inline-actions">
                    {!isWalletLinked && user && (
                      <button
                        className="profile-btn profile-btn--verify"
                        onClick={handleVerifyWallet}
                        disabled={isVerifying || !isConnected}
                        title={
                          !user
                            ? "Please log in to verify wallet"
                            : !isConnected
                            ? "Please connect wallet first"
                            : "Sign a message to verify wallet ownership"
                        }
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        {isVerifying ? "Verifying..." : "Verify Ownership"}
                      </button>
                    )}
                    {isWalletLinked && (
                      <div className="wallet-verified-status">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ color: "#4caf50" }}
                        >
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span style={{ color: "#4caf50", fontSize: "14px" }}>
                          Verified
                        </span>
                      </div>
                    )}
                    <button
                      className="profile-btn profile-btn--disconnect"
                      onClick={handleDisconnectWallet}
                      disabled={loading}
                      title="Disconnect wallet from this app (you'll remain connected in MetaMask)"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                      </svg>
                      Disconnect from App
                    </button>

                    {verificationError && (
                      <div
                        className="wallet-error"
                        style={{
                          background: "#ffebee",
                          border: "1px solid #f44336",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          marginTop: "8px",
                          fontSize: "13px",
                          color: "#c62828",
                        }}
                      >
                        ⚠️ {verificationError}
                      </div>
                    )}

                    <div className="wallet-disconnect-info">
                      <small>
                        💡 App disconnected. To fully disconnect from your
                        wallet, check your wallet's connected sites.
                      </small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="wallet-disconnected-info">
                  {error && (
                    <div className="wallet-error">
                      <p>{error}</p>
                    </div>
                  )}

                  {!wallet.hasMetaMask ? (
                    <div className="wallet-install-prompt">
                      <p>
                        No wallet detected. Please install a compatible wallet
                        to continue.
                      </p>
                      <a
                        href="https://walletconnect.com/explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-btn profile-btn--install"
                      >
                        Install Wallet
                      </a>
                    </div>
                  ) : (
                    <div className="wallet-connect-prompt">
                      <p>Connect your wallet to access exclusive features</p>

                      <ConnectButton.Custom>
                        {({
                          account,
                          chain,
                          openAccountModal,
                          openChainModal,
                          openConnectModal,
                          mounted,
                        }) => {
                          const ready = mounted;
                          const connected = ready && account && chain;

                          return (
                            <div
                              {...(!ready && {
                                "aria-hidden": true,
                                style: {
                                  opacity: 0,
                                  pointerEvents: "none",
                                  userSelect: "none",
                                },
                              })}
                            >
                              {(() => {
                                if (!connected) {
                                  return (
                                    <button
                                      className="profile-btn profile-btn--connect"
                                      onClick={openConnectModal}
                                      type="button"
                                    >
                                      Connect Wallet
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        }}
                      </ConnectButton.Custom>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Actions Section */}
            <div className="profile-section actions-section">
              <div className="profile-actions">
                {wallet.isVerified && (
                  <a href="/app" className="profile-btn profile-btn--app">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10,8 16,12 10,16 10,8"></polygon>
                    </svg>
                    Enter App
                  </a>
                )}
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
