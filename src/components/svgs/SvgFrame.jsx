import React from "react";

export default function SvgFrame({ className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* outer frame */}
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      {/* simple “mountain” inside */}
      <polygon points="5 19 10 13 14 17 19 11 19 19 5 19" />
    </svg>
  );
}
