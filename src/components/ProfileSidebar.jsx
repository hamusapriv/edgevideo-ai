// src/components/ProfileSidebar.jsx
import React from "react";

export default function ProfileSidebar({ isOpen, onClose }) {
  // `isOpen` controls the CSS class (slide‐in/out)
  return (
    <aside className={`profile-side${isOpen ? " open" : ""}`}>
      <div className="profile-header">
        <h4 className="screen-title">Account</h4>
        <button
          className="profile-close"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          {/* 24×24 close‐icon (X) SVG */}
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

      <div className="profile">
        <div className="avatar-wrapper big">
          <img
            loading="lazy"
            src="https://api.dicebear.com/9.x/bottts/svg?seed=guest"
            alt="User avatar large"
            className="avatar"
          />
        </div>
        <h3 className="name">Olivia Bennett</h3>
        <p className="username">@oliviab</p>
      </div>

      {/* Account settings */}
      <div className="list-block">
        <h5 className="block-title">Account settings</h5>
        <a className="list-row" href="#">
          <span>Orders &amp; returns</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
          </svg>
        </a>
        <a className="list-row" href="#">
          <span>Details &amp; password</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
          </svg>
        </a>
        <a className="list-row" href="#">
          <span>Refer a friend</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
          </svg>
        </a>
      </div>

      {/* Location */}
      <div className="list-block">
        <h5 className="block-title">My location</h5>
        <a className="list-row" href="#">
          <span>United States</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
          </svg>
        </a>
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
    </aside>
  );
}
