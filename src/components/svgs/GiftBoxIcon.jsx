import React from "react";

const GiftBoxIcon = ({ size = 24, color = "currentColor" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="8"
        width="18"
        height="13"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.1"
      />
      <path d="M12 8v13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M19 12H5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M7.5 8a2.5 2.5 0 0 1 0-5A2.5 2.5 0 0 1 10 5.5a2.5 2.5 0 0 1-2.5 2.5z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path
        d="M16.5 8a2.5 2.5 0 0 1 0-5A2.5 2.5 0 0 1 19 5.5a2.5 2.5 0 0 1-2.5 2.5z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path
        d="M3 8h18v3H3z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.3"
      />
    </svg>
  );
};

export default GiftBoxIcon;
