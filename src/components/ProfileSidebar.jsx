// src/components/ProfileSidebar.jsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import LogoutButton from "../auth/LogoutButton";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import PointsDisplay from "./PointsDisplay";
import DailyCheckIn from "./DailyCheckIn";
import Socials from "./Socials";
import FAQ from "./FAQ";
import { useState } from "react";
import { showCookieConsent } from "../utils/cookieManager";
import WalletSvg from "./svgs/WalletSvg";

export default function ProfileSidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { wallet, linkedWallet } = useWallet();
  const sidebarRef = useRef(null);

  // Pick avatar based on login state
  const avatarSeed = user ? user.avatarSeed : "guest";
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;

  const [showFaq, setShowFaq] = useState(false);

  // Click outside to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Use capture phase to handle the event before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`profile-side${isOpen ? " open" : ""}`}
      >
        <div className="profile-header">
          <h4 className="screen-title">Account</h4>
          <button
            className="profile-close"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              aria-hidden="true"
            >
              <path
                d="M6 6 L18 18 M18 6 L6 18"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {user ? (
          // ────── Signed-In Container ──────
          <div className="signed-in-container">
            <div className="profile">
              <div className="avatar-wrapper big">
                <img
                  loading="lazy"
                  src={avatarUrl}
                  alt={`${user.name}’s avatar`}
                  className="avatar"
                />
              </div>
              <h3 className="name">{user.name}</h3>
              <p className="username">@{user.email}</p>
            </div>

            {/* Points and Rewards Section */}
            <div className="list-block">
              <h5 className="block-title">Rewards</h5>
              <div className="sidebar-rewards">
                <PointsDisplay size="normal" showLabel={true} />
                <DailyCheckIn />
              </div>
            </div>

            {/* Wallet Section */}
            <div className="list-block wallet-block">
              <WalletSvg />
              <div className="wallet-header">
                <h5 className="block-title">Wallet</h5>
                {linkedWallet.isLinked && (
                  <div className="wallet-header-status">
                    <span className="status-indicator verified">✓</span>
                    <span>Verified & Linked</span>
                  </div>
                )}
              </div>
              {linkedWallet.isLinked ? (
                <div
                  className="wallet-info"
                  style={{
                    width: "100%",
                  }}
                >
                  <div
                    className="wallet-connected"
                    style={{
                      width: "100%",
                    }}
                  >
                    <div
                      className="wallet-address "
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        gap: "10px",
                        alignItems: "flex-start",
                        width: "100%",
                      }}
                    >
                      <span
                        className="wallet-label"
                        style={{
                          color: "#fff",
                        }}
                      >
                        Linked Wallet:
                      </span>
                      <span
                        className="wallet-value"
                        style={{
                          color: "#fff",
                          padding: "0",
                          border: "none",
                          background: "transparent",
                        }}
                      >
                        {linkedWallet.shortAddress}
                      </span>
                    </div>
                    {wallet.isConnected &&
                      wallet.address === linkedWallet.address && (
                        <div className="wallet-connection-status">
                          <span className="connection-indicator connected">
                            ●
                          </span>
                          <span>Currently Connected</span>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="wallet-cta">
                  <p className="wallet-message">
                    No wallet linked to your account
                  </p>
                  <Link
                    to="/home"
                    className="btn--primary wallet-link-btn"
                    onClick={onClose}
                  >
                    Link Wallet
                  </Link>
                </div>
              )}
            </div>

            {/* Account settings */}
            <div className="list-block none">
              <h5 className="block-title">Account settings</h5>
              <ListRow label="Orders & returns" />
              <ListRow label="Details & password" />
              <ListRow label="Refer a friend" />
            </div>

            {/* Location */}
            <div className="list-block none">
              <h5 className="block-title">My location</h5>
              <ListRow label="United States" />
            </div>

            {/* Shopping preferences */}
            <div className="list-block none">
              <h5 className="block-title">My shopping preferences</h5>
              <label className="pref-option selected">
                <span>Women</span>
                <span className="radio" />
              </label>
              <label className="pref-option">
                <span>Men</span>
                <span className="radio" />
              </label>
            </div>

            {/* Support */}
            <div className="list-block">
              <h5 className="block-title">Support</h5>
              <button
                type="button"
                className="list-row"
                onClick={() => {
                  setShowFaq(true);
                  onClose();
                }}
              >
                <span>See FAQs</span>
                <ArrowIcon />
              </button>

              <Link to="/terms" className="list-row" onClick={onClose}>
                <span>Terms &amp; conditions</span>
                <ArrowIcon />
              </Link>
              <Link to="/privacy" className="list-row" onClick={onClose}>
                <span>Privacy Policy</span>
                <ArrowIcon />
              </Link>
              <Link to="/cookies" className="list-row" onClick={onClose}>
                <span>Cookie Settings</span>
                <ArrowIcon />
              </Link>

              <button
                type="button"
                className="list-row"
                onClick={() => {
                  showCookieConsent();
                  onClose();
                }}
              >
                <span>Reset Cookie Preferences</span>
                <ArrowIcon />
              </button>
            </div>

            <button className="btn--secondary">Contact us</button>
            <Socials />
            <LogoutButton />
          </div>
        ) : (
          // ────── Signed-Out Container ──────
          <div className="signed-out-container">
            <div className="profile">
              <div className="avatar-wrapper big">
                <img
                  loading="lazy"
                  src={avatarUrl}
                  alt="Guest avatar"
                  className="avatar"
                />
              </div>
              <h3 className="name">Welcome!</h3>
              <p className="username">Please sign in to access your account</p>
              <div style={{ marginTop: "1rem" }}>
                <GoogleSignInButton />
              </div>
            </div>

            {/* Support */}
            <div className="list-block">
              <h5 className="block-title">Support</h5>
              <button
                type="button"
                className="list-row"
                onClick={() => {
                  setShowFaq(true);
                  onClose();
                }}
              >
                <span>See FAQs</span>
                <ArrowIcon />
              </button>

              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="list-row"
                onClick={onClose}
              >
                <span>Terms &amp; conditions</span>
                <ArrowIcon />
              </Link>

              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="list-row"
                onClick={onClose}
              >
                <span>Privacy Policy</span>
                <ArrowIcon />
              </Link>

              <Link to="/cookies" className="list-row" onClick={onClose}>
                <span>Cookie Settings</span>
                <ArrowIcon />
              </Link>

              <button
                type="button"
                className="list-row"
                onClick={() => {
                  showCookieConsent();
                  onClose();
                }}
              >
                <span>Reset Cookie Preferences</span>
                <ArrowIcon />
              </button>
            </div>

            <button className="contact-btn btn--secondary">Contact us</button>
            <Socials />
          </div>
        )}
      </aside>
      <FAQ isOpen={showFaq} onClose={() => setShowFaq(false)} />
    </>
  );
}

// Simple reusable row with the “>” arrow
function ListRow({ label }) {
  return (
    <a className="list-row" href="#">
      <span>{label}</span>
      <ArrowIcon />
    </a>
  );
}

// Arrow icon extraction
function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
    </svg>
  );
}
