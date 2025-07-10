import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { channels } from "../data/channels";
import ChannelLogo from "../components/ChannelLogo";

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const [channel, setChannel] = useState(null);

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

  if (!channel) {
    return <div className="demo-page" style={{ padding: "1rem" }}>Channel not found.</div>;
  }

  return (
    <div className="demo-page" style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <ChannelLogo channelId={channel.id} />
      </div>
      <video controls autoPlay style={{ width: "100%", maxWidth: "640px" }}>
        <source src={channel.streamUrl} type="application/x-mpegURL" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
