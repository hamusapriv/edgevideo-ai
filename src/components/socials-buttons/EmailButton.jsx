import React from "react";

export default function EmailButton({ className = "", ...props }) {
  return (
    <a
      className={`social-a-wrap ${className}`}
      href="mailto:support@edgevideo.ai"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
        <polyline points="3 7 12 13 21 7" />
      </svg>
    </a>
  );
}
