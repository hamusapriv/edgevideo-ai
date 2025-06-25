import React, { useState, useEffect } from "react";
import fallbackLogo from "../assets/edgevideoai-logo.png";

const API_BASE =
  import.meta.env.VITE_STUDIO_API_URL ||
  "https://studio-api.edgevideo.com";

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
          `${API_BASE}/channel/loadChannelLogo/${channel}`
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        const logo = json?.data?.[0]?.logo_url;
        if (!logo) throw new Error("logo_url missing in response");
        if (!cancelled) setLogoUrl(logo);
      } catch (err) {
        console.error("ChannelLogo fetch error:", err);
        if (!cancelled) {
          // fall back to bundled logo
          setLogoUrl(fallbackLogo);
          setError(null);
        }
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
    return <div className="channel-logo-loading">Loading logo…</div>;
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
