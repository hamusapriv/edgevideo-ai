import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { channels } from "../data/channels";
import ChannelLogo from "../components/ChannelLogo";
import "../styles/demoPage.css"; // Ensure this file exists and contains necessary styles

import Hls from "hls.js";
export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const [channel, setChannel] = useState(null);
  const origin = window.location.origin;

  const videoRef = useRef(null);
  useEffect(() => {
    const name = searchParams.get("channelName");
    if (!name) return;
    const match = channels.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (match) {
      setChannel(match);
      window.channelId = match.id;
      try {
        localStorage.setItem("channelId", match.id);
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!channel) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.streamUrl;
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [channel]);
  return (
    <div className="demo-page">
      <div className="demo-links">
        <ul className="quick-access-list">
          {channels.map((c) => (
            <li key={c.id}>
              <button
                className="btn btn--primary quick-access-btn"
                onClick={() => {
                  window.location.href = `${origin}/demo?channelName=${encodeURIComponent(
                    c.name
                  )}`;
                }}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {channel ? (
        <>
          <div className="channel-logo">
            <ChannelLogo channelId={channel.id} />
          </div>
          <video ref={videoRef} controls autoPlay muted>
            Your browser does not support the video tag.
          </video>
        </>
      ) : (
        <p style={{ padding: "1rem" }}>Channel not found.</p>
      )}
    </div>
  );
}
