import React from "react";

const VideoStreamIcon = ({ size = 24, color = "currentColor" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="3"
        width="20"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.1"
      />
      <path
        d="m10 8 4 3-4 3V8z"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle
        cx="19"
        cy="6"
        r="2"
        fill="#ff4444"
        stroke="white"
        strokeWidth="1"
      />
      <path d="M2 19h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 19h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 19h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default VideoStreamIcon;
