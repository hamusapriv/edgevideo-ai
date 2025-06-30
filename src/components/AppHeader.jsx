// src/components/AppHeader.jsx
import React from "react";
import EdgeLogo from "../assets/edgevideoai-logo.png";
import ChannelLogo from "./ChannelLogo";

export default function AppHeader() {
  const channelId = window.channelId;

  return (
    <header className="header">
      <img src={EdgeLogo} alt="EdgeVideo" height="30" />
      {/* The sidebar‐toggle button has been removed from here */}

      {channelId && <ChannelLogo channelId={channelId} className="channel-logo" />}
    </header>
  );
}
