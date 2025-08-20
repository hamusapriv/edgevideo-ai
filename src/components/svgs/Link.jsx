import React from "react";

const Link = ({ size = 24, color = "currentColor", ...props }) => {
  return (
    <>
      {" "}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size * 5}
        height={size * 1.5}
        viewBox="0 0 120 36"
        role="img"
        aria-labelledby="title desc"
        {...props}
      >
        <title id="title">Wallet ↔ Profile (compact)</title>
        <desc id="desc">
          Wallet icon, a &lt;--&gt; indicator, and a profile icon placed close
          together.
        </desc>
        <style>
          {`.icon { fill: none; stroke: ${color}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
                .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; fill: ${color}; font-weight: 700; }`}
        </style>

        {/* Wallet icon (left, compact) */}
        <g className="icon" transform="translate(8,6)" aria-hidden="true">
          <rect x="0" y="6" width="28" height="18" rx="4" />
          <path d="M6 6V4a3 3 0 0 1 3-3h10" />
          <rect x="18" y="10" width="10" height="10" rx="2" />
          <circle cx="23" cy="15" r="1.5" fill={color} stroke="none" />
        </g>

        {/* <--> indicator (tight spacing) */}
        <text
          x="56"
          y="22"
          className="mono"
          fontSize="12"
          textAnchor="middle"
          aria-hidden="true"
        >
          &lt;--&gt;
        </text>

        {/* Profile icon (right, closer) */}
        <g className="icon" transform="translate(84,6)" aria-hidden="true">
          <circle cx="12" cy="12" r="14" />
          <circle cx="12" cy="8" r="5" />
          <path d="M2 22c2-5 18-5 20 0" />
        </g>
      </svg>
      <p>Verify Ownership</p>
    </>
  );
};

export default Link;
