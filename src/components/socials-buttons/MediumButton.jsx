import React from "react";

export default function MediumButton({ className = "", ...props }) {
  return (
    <a
      className={`social-a-wrap ${className}`}
      href="https://medium.com/edge-video-ai"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      <svg
        className="toggle-svg"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 121 69"
        fill="currentColor"
      >
        <circle cx="34.5" cy="34.5" r="34.5" />
        <ellipse cx="88" cy="34.5" rx="16" ry="31.5" />
        <ellipse cx="114.5" cy="34.5" rx="6.5" ry="28.5" />
      </svg>
    </a>
  );
}
