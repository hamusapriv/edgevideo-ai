import React, { useState, useEffect } from "react";
import LoadingOverlay from "./LoadingOverlay";

/**
 * ChannelLogo
 * Fetches and displays the channel logo based on channelId.
 * Defaults to window.channelId if no prop is provided.
 * Falls back to a generic logo if fetch fails.
 */
export default function ChannelLogo({
  channelId: propChannelId,
  className = "",
  ...imgProps
}) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine which channelId to use
  const channel = propChannelId || window.channelId;

  // Fallback logo mapping for known channels
  const fallbackLogos = {
    "2d192295-4e70-4187-a06d-55ecac2f9bf6": "/assets/logo.png", // ATP Media
    "customer-test-channel-charles": "/assets/logo.png", // Customer Test Channel Charles
    "946027d4-367c-4f7d-90e4-4929638d60bc": "/assets/logo.png", // CW Networks
    "a1ba66f8-4540-444d-be98-bc5f761169c0": "/assets/logo.png", // Danger TV
    "edge-video-ai-promo": "/assets/logo.png", // Edge Video AI Promo
    "4deb3daf-a58c-4da5-aabc-e84f00eb50da": "/assets/logo.png", // EuroNews
    "bf08f473-7888-4fbb-a97e-d862f484a1c8": "/assets/logo.png", // EuroNews Travel
    "3af7a440-2c68-45bc-ab31-9384fc4c4bcb": "/assets/logo.png", // Insight TV (EU)
    "ada3896d-0456-4589-95fa-cf71718b79c8": "/assets/logo.png", // Insight TV (UK)
    "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e": "/assets/logo.png", // Insight TV (US)
    lionsgate: "/assets/logo.png", // Lionsgate
    "ba08370c-0362-462d-b299-97cc36973340": "/assets/logo.png", // MVMNT Culture
    "ba398d25-ef88-4762-bcd6-d75a2930fbeb": "/assets/logo.png", // Narative Entertainment
    "2de0e45d-1eda-4f15-a4d8-0076485b9545": "/assets/logo.png", // Wedosport
    "43b08654-edb3-4757-9a53-4249b3f6ddfd": "/assets/logo.png", // WILD TV
    default: "/assets/logo.png",
  };

  useEffect(() => {
    let cancelled = false;
    if (!channel) {
      setError("No channelId provided");
      setLoading(false);
      return;
    }

    // Known problematic channels that consistently return 500 errors
    const problematicChannels = [
      "customer-test-channel-charles",
      "edge-video-ai-promo",
      "lionsgate",
    ];

    // For problematic channels, skip API call and use fallback immediately
    if (problematicChannels.includes(channel)) {
      const fallback = fallbackLogos[channel] || fallbackLogos.default;
      setLogoUrl(fallback);
      setLoading(false);
      return;
    }

    async function fetchLogo() {
      try {
        setLoading(true);
        setError(null);

        // Create an AbortController for request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const res = await fetch(
          `https://studio-api.edgevideo.com/channel/loadChannelLogo/${channel}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const logo = json?.data?.[0]?.logo_url;

        if (!logo) {
          throw new Error("logo_url missing in response");
        }

        if (!cancelled) {
          setLogoUrl(logo);
          setLoading(false);
        }
      } catch (err) {
        console.warn(
          `ChannelLogo: Using fallback for ${channel} due to:`,
          err.message
        );
        if (!cancelled) {
          // Always use fallback logo on any error
          const fallback = fallbackLogos[channel] || fallbackLogos.default;
          setLogoUrl(fallback);
          setError(null); // Don't show error, just use fallback silently
          setLoading(false);
        }
      }
    }

    fetchLogo();
    return () => {
      cancelled = true;
    };
  }, [channel]);

  if (loading) {
    return (
      <div
        className="channel-logo-loading"
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid #ccc",
            borderTop: "2px solid #617afa",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  if (error && !logoUrl) {
    return (
      <div
        className="channel-logo-error"
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#333",
          borderRadius: "6px",
          color: "#999",
          fontSize: "12px",
        }}
      >
        Logo
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
      onError={(e) => {
        // If even the fallback fails, show a generic placeholder
        if (e.target.src !== fallbackLogos.default) {
          e.target.src = fallbackLogos.default;
        } else {
          // Hide image and show text placeholder
          e.target.style.display = "none";
          const placeholder = document.createElement("div");
          placeholder.style.cssText =
            "width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #333; border-radius: 6px; color: #999; font-size: 12px;";
          placeholder.textContent = "Logo";
          e.target.parentNode.replaceChild(placeholder, e.target);
        }
      }}
      {...imgProps}
    />
  );
}
