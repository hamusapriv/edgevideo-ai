// src/components/FloatingProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import LogoutButton from "../auth/LogoutButton";
import WalletSvg from "./svgs/WalletSvg";

export default function FloatingProfile() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { user } = useAuth();
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
    try {
      await verifyWallet();
    } catch (error) {
      console.error("Failed to verify wallet:", error);
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
              <h3>Sign In</h3>
              <p>Connect to access your profile and wallet</p>
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
              <div className="profile-section-header">
                <div className="profile-section-title">
                  <WalletSvg />
                  <h4>Wallet</h4>
                </div>
                {wallet.isConnected && (
                  <span
                    className={`status-badge ${
                      wallet.isVerified ? "verified" : "connected"
                    }`}
                  >
                    {wallet.isVerified ? "✓ Verified" : "🔗 Connected"}
                  </span>
                )}
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
                    {!wallet.isVerified && (
                      <button
                        className="profile-btn profile-btn--verify"
                        onClick={handleVerifyWallet}
                        disabled={true}
                        title="Coming Soon"
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
                        {loading ? "Verifying..." : "Verify Ownership"}
                      </button>
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
                  </div>
                  <div className="wallet-disconnect-info">
                    <small>
                      💡 To fully disconnect, go to MetaMask → Connected sites →
                      Disconnect
                    </small>
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
                      <div className="wallet-icon">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <p>
                        MetaMask not detected. Please install MetaMask to
                        continue.
                      </p>
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-btn profile-btn--install"
                      >
                        Install MetaMask
                      </a>
                    </div>
                  ) : (
                    <div className="wallet-connect-prompt">
                      <div className="wallet-icon">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16,6 16,20 21,12"></polygon>
                        </svg>
                      </div>
                      <p>Connect your wallet to access exclusive features</p>
                      <button
                        className="profile-btn profile-btn--connect"
                        onClick={handleConnectWallet}
                        disabled={loading}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16,6 16,20 21,12"></polygon>
                        </svg>
                        {loading ? "Connecting..." : "Connect Wallet"}
                      </button>
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
