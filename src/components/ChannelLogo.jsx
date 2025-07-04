import React, { useState, useEffect } from "react";
import LoadingOverlay from "./LoadingOverlay";

/**
 * ChannelLogo
 * Fetches and displays the channel logo based on channelId.
 * Defaults to window.channelId if no prop is provided.
 */
export default function ChannelLogo({
  channelId: propChannelId,
  className = "",
  ...imgProps
}) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [error, setError] = useState(null);

  // Determine which channelId to use
  const channel = propChannelId || window.channelId;

  useEffect(() => {
    let cancelled = false;
    if (!channel) {
      setError("No channelId provided");
      return;
    }

    async function fetchLogo() {
      try {
        const res = await fetch(
          `https://studio-api.edgevideo.com/channel/loadChannelLogo/${channel}`
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        const logo = json?.data?.[0]?.logo_url;
        if (!logo) throw new Error("logo_url missing in response");
        if (!cancelled) setLogoUrl(logo);
      } catch (err) {
        console.error("ChannelLogo fetch error:", err);
        if (!cancelled) setError("Failed to load channel logo");
      }
    }

    fetchLogo();
    return () => {
      cancelled = true;
    };
  }, [channel]);

  if (error) {
    return <div className="channel-logo-error">{error}</div>;
  }
  if (!logoUrl) {
    return (
      <div className="channel-logo-loading">
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <img
      id="channelLogo"
      className={className}
      src={logoUrl}
      srcSet={logoUrl}
      alt="Channel Logo"
      {...imgProps}
    />
  );
}
