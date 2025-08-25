// src/components/FloatingProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import LogoutButton from "../auth/LogoutButton";
import WalletSvg from "./svgs/WalletSvg";
import Link from "./svgs/Link";
import rainbowKitWalletService from "../services/rainbowKitWalletService";
import "../styles/FloatingProfile.css";

export default function FloatingProfile() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [isWalletLinked, setIsWalletLinked] = useState(false);
  const [linkedWalletInfo, setLinkedWalletInfo] = useState(null);
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

  // Generate avatar URL for fallback (same logic as ProfileSidebar)
  const avatarSeed = user ? user.avatarSeed : "guest";
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;

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

      // Refresh wallet status
      const status = await rainbowKitWalletService.isWalletLinked();
      if (status.isLinked && status.linkedAddress) {
        setLinkedWalletInfo({
          address: status.linkedAddress,
          shortAddress: `${status.linkedAddress.slice(
            0,
            6
          )}...${status.linkedAddress.slice(-4)}`,
          isCurrentWallet: status.isCurrentWalletLinked,
          blockReason: status.blockReason,
        });
      }
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
      if (user) {
        try {
          // Always check if user has a linked wallet when they're logged in
          const status = await rainbowKitWalletService.isWalletLinked();
          console.log("🔍 Wallet link status:", status);

          // Only show as verified if wallet is truly linked, not just if current wallet could be linked
          setIsWalletLinked(status.isLinked);

          if (status.isLinked && status.linkedAddress) {
            setLinkedWalletInfo({
              address: status.linkedAddress,
              shortAddress: `${status.linkedAddress.slice(
                0,
                6
              )}...${status.linkedAddress.slice(-4)}`,
              isCurrentWallet: status.isCurrentWalletLinked,
              blockReason: status.blockReason,
            });
          } else {
            setLinkedWalletInfo(null);
          }
        } catch (error) {
          console.error("Failed to check wallet link status:", error);
          setIsWalletLinked(false);
          setLinkedWalletInfo(null);
        }
      } else {
        setIsWalletLinked(false);
        setLinkedWalletInfo(null);
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
                <img
                  src={avatarUrl}
                  alt={user.name || "User"}
                  className="avatar-image"
                />
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
                    <img
                      src={avatarUrl}
                      alt={user.name || "User"}
                      className="user-avatar"
                    />
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
            <div className="profile-section">
              <WalletSvg />
              <div className="section-header">
                <div className="section-title">
                  <h4>Wallet</h4>
                </div>
                <div className="status-badges">
                  {wallet.isConnected && (
                    <span className="status-badge connected">🔗 Connected</span>
                  )}
                  {isWalletLinked && (
                    <span className="status-badge verified">
                      ✓ Verified & Linked
                    </span>
                  )}
                </div>
              </div>

              {/* Show linked wallet info even if not currently connected */}
              {linkedWalletInfo && (
                <div className="linked-wallet-info">
                  <div className="wallet-address-card">
                    <div className="address-header">
                      <span className="address-label">
                        {linkedWalletInfo.isCurrentWallet
                          ? "Current Wallet"
                          : "Linked Wallet"}
                      </span>
                    </div>
                    <div className="address-value">
                      <span className="address-text">
                        {linkedWalletInfo.shortAddress}
                      </span>
                      <button
                        className="copy-address-btn"
                        title="Copy address"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            linkedWalletInfo.address
                          );
                          console.log(
                            "Linked wallet address copied to clipboard"
                          );
                        }}
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
                </div>
              )}

              {wallet.isConnected ? (
                <div className="wallet-connected-info">
                  {/* Only show current wallet address card if it's different from linked wallet or if no linked wallet */}
                  {(!linkedWalletInfo || linkedWalletInfo.isCurrentWallet) && (
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
                  )}

                  <div className="wallet-inline-actions">
                    {/* Only show verify button if wallet is connected but not linked */}
                    {!isWalletLinked && user && isConnected && (
                      <button
                        className="profile-btn profile-btn--verify"
                        onClick={handleVerifyWallet}
                        disabled={isVerifying}
                        title="Sign a message to verify wallet ownership"
                      >
                        {isVerifying ? (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="spinning-icon"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 2 L12 6" />
                              <path d="M12 18 L12 22" />
                              <path d="M4.93 4.93 L7.76 7.76" />
                              <path d="M16.24 16.24 L19.07 19.07" />
                              <path d="M2 12 L6 12" />
                              <path d="M18 12 L22 12" />
                              <path d="M4.93 19.07 L7.76 16.24" />
                              <path d="M16.24 7.76 L19.07 4.93" />
                            </svg>
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Link size={16} color="currentColor" />
                            <span>Verify Ownership</span>
                          </>
                        )}
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

                  {/* Only show connect wallet option if user doesn't have a linked wallet */}
                  {!isWalletLinked ? (
                    <>
                      {!wallet.hasMetaMask ? (
                        <div className="wallet-install-prompt">
                          <p>
                            No wallet detected. Please install a compatible
                            wallet to continue.
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
                          <p>Link your wallet to access exclusive features</p>

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
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Enhanced Actions Section */}
            <div className="profile-section actions-section">
              <div className="profile-actions">
                {isWalletLinked && (
                  <a
                    href="/app?channelId=3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e"
                    className="profile-btn profile-btn--app"
                  >
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
