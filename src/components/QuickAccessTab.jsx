import React from "react";
import { channels } from "../data/channels";
import ChannelLogo from "./ChannelLogo";

export default function QuickAccessTab() {
  const origin = window.location.origin;

  const handleChannelClick = (id) => {
    window.location.href = `${origin}/app?channelId=${id}`;
  };

  return (
    <div className="tab-content-container">
      <div className="quick-access-grid">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="channel-card"
            onClick={() => handleChannelClick(channel.id)}
          >
            <div className="channel-card-logo">
              <ChannelLogo
                channelId={channel.id}
                className="channel-logo-small"
              />
            </div>
            <div className="channel-card-content">
              <h4 className="channel-name">{channel.name}</h4>
              <span className="channel-type">
                {channel.isYouTubeEmbed ? "YouTube" : "Live Stream"}
              </span>
            </div>
            <div className="channel-card-arrow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
