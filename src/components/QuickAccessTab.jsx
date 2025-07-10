import React from "react";
import { channels } from "../data/channels";

export default function QuickAccessTab() {
  const origin = window.location.origin;
  return (
    <div className="tab-content-container">
      <ul className="quick-access-list">
        {channels.map((c) => (
          <li key={c.id}>
            <button
              className="btn btn--primary quick-access-btn"
              onClick={() => {
                window.location.href = `${origin}/app?channelId=${c.id}`;
              }}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
