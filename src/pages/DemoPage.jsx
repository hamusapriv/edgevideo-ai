import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { channels } from "../data/channels";
import ChannelLogo from "../components/ChannelLogo";

import Hls from "hls.js";
export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const [channel, setChannel] = useState(null);

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
  if (!channel) {
    return (
      <div className="demo-page" style={{ padding: "1rem" }}>
        Channel not found.
      </div>
    );
  }

  return (
    <div className="demo-page" style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <ChannelLogo channelId={channel.id} />
      </div>
      <video
        ref={videoRef}
        controls
        autoPlay
        style={{ width: "100%", maxWidth: "640px" }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
