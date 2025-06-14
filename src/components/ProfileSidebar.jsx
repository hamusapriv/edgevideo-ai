// src/components/ProfileSidebar.jsx
import React from "react";
import { useAuth } from "../auth/AuthContext";
import LogoutButton from "../auth/LogoutButton";
import GoogleSignInButton from "../auth/GoogleSignInButton";

export default function ProfileSidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  // Pick avatar based on login state
  const avatarSeed = user ? user.avatarSeed : "guest";
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;

  return (
    <aside className={`profile-side${isOpen ? " open" : ""}`}>
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

          {/* Account settings */}
          <div className="list-block">
            <h5 className="block-title">Account settings</h5>
            <ListRow label="Orders & returns" />
            <ListRow label="Details & password" />
            <ListRow label="Refer a friend" />
          </div>

          {/* Location */}
          <div className="list-block">
            <h5 className="block-title">My location</h5>
            <ListRow label="United States" />
          </div>

          {/* Shopping preferences */}
          <div className="list-block">
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
            <a className="list-row" href="#">
              <span>Terms &amp; conditions</span>
            </a>
            <a className="list-row" href="#">
              <span>Privacy Policy</span>
            </a>
          </div>

          <button className="btn--secondary">Contact us</button>
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

          {/* You can choose to show minimal links here, or nothing at all */}
          <div className="list-block">
            <h5 className="block-title">Support</h5>
            <a className="list-row" href="#">
              <span>Terms &amp; conditions</span>
            </a>
            <a className="list-row" href="#">
              <span>Privacy Policy</span>
            </a>
          </div>

          <button className="contact-btn btn--secondary">Contact us</button>
        </div>
      )}
    </aside>
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
