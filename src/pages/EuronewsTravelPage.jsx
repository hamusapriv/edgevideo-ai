import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import "../styles/EuronewsTravelPage.css";

const EuronewsTravelPage = () => {
  const videoRef = useRef(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);

  const HLS_URL = "https://euronews-travel.edgevideo.ai/hls/stream.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoLoading(true);
    setVideoError(null);

    // Store reference to HLS instance for cleanup
    let hlsInstance = null;

    // Clear any previous sources
    video.src = "";
    video.load();

    // Video event listeners
    const handleLoadStart = () => {
      setVideoLoading(true);
    };

    const handleCanPlay = () => {
      setVideoLoading(false);
    };

    const handleVideoError = (e) => {
      console.error("Video element error:", e, video.error);
      setVideoError(video.error?.message || "Failed to load video");
      setVideoLoading(false);
    };

    const handleLoadedData = () => {
      setVideoLoading(false);
    };

    // Add event listeners
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleVideoError);
    video.addEventListener("loadeddata", handleLoadedData);

    // Try native HLS support first (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_URL;
    }
    // Use HLS.js for other browsers
    else if (Hls.isSupported()) {
      hlsInstance = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
      });

      // HLS event handlers
      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("Media attached to HLS");
      });

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("HLS manifest parsed, levels:", data.levels);
      });

      hlsInstance.on(Hls.Events.LEVEL_LOADED, () => {
        console.log("Level loaded");
      });

      hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
        // Fragment loaded successfully - stream is working
        if (videoLoading) {
          setVideoLoading(false);
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error");
              setVideoError("Network error: Cannot load stream");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error, attempting recovery");
              try {
                hlsInstance.recoverMediaError();
              } catch (err) {
                setVideoError("Media error: Cannot play stream");
              }
              break;
            default:
              console.error("Fatal error");
              setVideoError("Stream error: Cannot load video");
              hlsInstance.destroy();
              break;
          }
        } else {
          // Non-fatal error, log but don't show error to user
          console.warn("Non-fatal HLS error:", data);
        }
        setVideoLoading(false);
      });

      // Load the stream
      hlsInstance.loadSource(HLS_URL);
      hlsInstance.attachMedia(video);
    }
    // HLS not supported
    else {
      console.error("HLS not supported in this browser");
      setVideoError("HLS streaming not supported by this browser");
      setVideoLoading(false);
    }

    // Cleanup function
    return () => {
      // Remove event listeners
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleVideoError);
      video.removeEventListener("loadeddata", handleLoadedData);

      // Clean up HLS instance
      if (hlsInstance) {
        try {
          hlsInstance.destroy();
        } catch (err) {
          console.warn("Error destroying HLS instance:", err);
        }
      }

      // Clear video source
      video.src = "";
      video.load();
    };
  }, []);

  return (
    <div className="euronews-travel-page">
      <div className="video-container">
        {videoLoading && (
          <div className="video-loading">
            <div className="loading-spinner"></div>
            <p>Loading Euronews Travel stream...</p>
          </div>
        )}

        {videoError && (
          <div className="video-error">
            <div className="error-icon">⚠️</div>
            <p>{videoError}</p>
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          playsInline
          className="euronews-video"
          style={{
            display: videoLoading || videoError ? "none" : "block",
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default EuronewsTravelPage;
