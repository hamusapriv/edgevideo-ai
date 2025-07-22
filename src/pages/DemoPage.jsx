import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { channels } from "../data/channels";
import ChannelLogo from "../components/ChannelLogo";
import { initProductsFeature } from "../legacy/screen";
import "../styles/demoPage.css";
import { downloadProduct } from "../utils/downloadProduct";
import Hls from "hls.js";
import edgevideoIcon from "/assets/logo.png"; // Adjust path as needed
import "../styles/reset.css"; // Ensure reset styles are applied

export default function DemoPage() {
  const [channel, setChannel] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  // const navigate = useNavigate(); // no navigation needed
  const origin = window.location.origin;
  const videoRef = useRef(null);

  // Handle channel selection without page reload
  const handleSelectChannel = (c) => {
    console.log(
      "Selecting channel:",
      c.name,
      "ID:",
      c.id,
      "Stream URL:",
      c.streamUrl
    );

    // Check for known problematic URLs
    if (c.streamUrl && c.streamUrl.includes("junk.m3u8")) {
      console.warn("Warning: This channel has a test/invalid stream URL");
    }

    // Clear any existing products when switching channels
    setLiveProducts([]);

    setChannel(c);

    // Set channel ID for shopping functionality - CRITICAL for products
    window.channelId = c.id;

    // Store in localStorage for persistence
    try {
      localStorage.setItem("channelId", c.id);
    } catch (error) {
      console.warn("Could not store channel ID in localStorage:", error);
    }

    // Log the channel change for debugging
    console.log("Channel ID set to:", window.channelId);
    console.log("localStorage channelId:", localStorage.getItem("channelId"));

    // Initialize products for new channel
    initProductsFeature();
  };

  const handleBackToChannels = () => {
    console.log("Clearing channel selection");
    setChannel(null);
    window.channelId = null;
    try {
      localStorage.removeItem("channelId");
    } catch (error) {
      console.warn("Could not remove channel ID from localStorage:", error);
    }
  };

  // Product widget functionality
  const handleDownload = async (product) => {
    await downloadProduct(product);
  };

  // Listen for new products from the productsModule
  useEffect(() => {
    function handleNewProduct(event) {
      const product = event.detail;
      if (!product) return;

      setLiveProducts((prev) => {
        // Check if product already exists
        if (prev.some((p) => p.id === product.id)) return prev;

        // Add new product to the beginning, keep max 10 products
        const updated = [product, ...prev].slice(0, 10);
        return updated;
      });

      // Show widget when first product arrives
      if (!isWidgetVisible) {
        setIsWidgetVisible(true);
      }
    }

    // Add event listener for new products
    window.addEventListener("new-product", handleNewProduct);

    // Show widget after a short delay for demo purposes
    const timer = setTimeout(() => {
      setIsWidgetVisible(true);
    }, 2000);

    return () => {
      window.removeEventListener("new-product", handleNewProduct);
      clearTimeout(timer);
    };
  }, [isWidgetVisible]);

  // Clean up URL parameters on component mount
  useEffect(() => {
    // Remove any existing URL parameters to keep the URL clean
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!channel) return;
    const video = videoRef.current;
    if (!video) return;

    console.log(
      "Loading video for channel:",
      channel.name,
      "Channel ID:",
      channel.id,
      "Stream URL:",
      channel.streamUrl,
      "YouTube URL:",
      channel.youtubeUrl
    );

    setVideoLoading(true);
    setVideoError(null);

    // Handle YouTube embeds (like EuroNews)
    if (channel.isYouTubeEmbed && channel.youtubeUrl) {
      console.log("Using YouTube embed for:", channel.name);
      setVideoLoading(false);
      return;
    }

    // Store reference to HLS instance for cleanup
    let hlsInstance = null;

    // Clear any previous sources
    video.src = "";
    video.load();

    // Check if URL is valid
    if (!channel.streamUrl || channel.streamUrl.includes("junk.m3u8")) {
      setVideoError("Invalid stream URL for this channel");
      setVideoLoading(false);
      return;
    }

    // Video event listeners
    const handleLoadStart = () => {
      console.log("Video load started for:", channel.name);
      setVideoLoading(true);
    };

    const handleCanPlay = () => {
      console.log("Video can play for:", channel.name);
      setVideoLoading(false);
    };

    const handleVideoError = (e) => {
      console.error("Video element error:", e, video.error);
      setVideoError(video.error?.message || "Failed to load video");
      setVideoLoading(false);
    };

    const handleLoadedData = () => {
      console.log("Video data loaded for:", channel.name);
      setVideoLoading(false);
    };

    // Add event listeners
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleVideoError);
    video.addEventListener("loadeddata", handleLoadedData);

    // Try native HLS support first (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("Using native HLS support for:", channel.name);
      video.src = channel.streamUrl;
    }
    // Use HLS.js for other browsers
    else if (Hls.isSupported()) {
      console.log("Using HLS.js for:", channel.name);

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
        console.log("HLS media attached for:", channel.name);
      });

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log(
          "HLS manifest parsed for:",
          channel.name,
          "Levels:",
          data.levels.length
        );
      });

      hlsInstance.on(Hls.Events.LEVEL_LOADED, () => {
        console.log("HLS level loaded for:", channel.name);
      });

      hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
        // Fragment loaded successfully - stream is working
        if (videoLoading) {
          setVideoLoading(false);
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error for", channel.name, ":", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error for:", channel.name);
              setVideoError(
                `Network error: Cannot load stream for ${channel.name}`
              );
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(
                "Fatal media error for:",
                channel.name,
                "attempting recovery"
              );
              try {
                hlsInstance.recoverMediaError();
              } catch (err) {
                setVideoError(
                  `Media error: Cannot play stream for ${channel.name}`
                );
              }
              break;
            default:
              console.error("Fatal error for:", channel.name);
              setVideoError(`Stream error: Cannot load ${channel.name}`);
              hlsInstance.destroy();
              break;
          }
        } else {
          // Non-fatal error, log but don't show error to user
          console.warn("Non-fatal HLS error for:", channel.name, data);
        }
        setVideoLoading(false);
      });

      // Load the stream
      hlsInstance.loadSource(channel.streamUrl);
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
      console.log("Cleaning up video for:", channel.name);

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
  }, [channel]);
  return (
    <div className="demo-page">
      {/* Hero Section */}
      <div className="demo-hero">
        <Link to="/" className="demo-logo">
          <img src={edgevideoIcon} alt="EdgeVideo AI" />
          <span>EdgeVideo AI</span>
        </Link>
        <h1>Live Shopping Demo</h1>
        <p>Experience AI-powered product detection in real-time</p>
      </div>

      {/* Channel Selection */}
      <div className="demo-channel-section">
        <div className="channel-selector">
          <label htmlFor="channelSelect">Select Channel</label>
          <div className="select-wrapper">
            <select
              id="channelSelect"
              value={channel?.id || ""}
              onChange={(e) => {
                const selected = channels.find((c) => c.id === e.target.value);
                if (selected) handleSelectChannel(selected);
              }}
            >
              <option value="" disabled>
                Choose a channel to start
              </option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="select-arrow">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path
                  d="M1 1L6 6L11 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {channel && (
          <div className="selected-channel">
            <ChannelLogo channelId={channel.id} className="channel-icon" />
            <div className="channel-details">
              <span className="channel-name">{channel.name}</span>
              <span className="channel-status">
                <span className="status-indicator"></span>
                Live
              </span>
            </div>
            <button
              onClick={handleBackToChannels}
              className="clear-selection-btn"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="demo-main">
        <div className="demo-container">
          {channel && (
            <div className="demo-content-grid">
              <div className="video-container">
                <div className="video-wrapper">
                  {videoLoading && (
                    <div className="video-loading">
                      <div className="loading-spinner"></div>
                      <span>Loading stream...</span>
                    </div>
                  )}
                  {videoError && (
                    <div className="video-error">
                      <span>⚠️ {videoError}</span>
                    </div>
                  )}

                  {/* YouTube Embed for special channels */}
                  {channel.isYouTubeEmbed && channel.youtubeUrl ? (
                    <iframe
                      src={channel.youtubeUrl}
                      title={`${channel.name} Live Stream`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="demo-video youtube-embed"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: videoLoading || videoError ? "none" : "block",
                      }}
                    />
                  ) : (
                    /* Regular HLS Video */
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="demo-video"
                      style={{
                        display: videoLoading || videoError ? "none" : "block",
                      }}
                      onLoadStart={() =>
                        console.log("Video element load start")
                      }
                      onCanPlay={() => console.log("Video element can play")}
                      onPlay={() => console.log("Video started playing")}
                      onPause={() => console.log("Video paused")}
                      onWaiting={() => console.log("Video waiting for data")}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>

              <div className="widget-container">
                {/* Inline Product Widget */}
                <div
                  className={`demo-product-widget ${
                    isWidgetVisible ? "visible" : ""
                  }`}
                >
                  <div className="widget-header">
                    Live Shopping Demo Experience
                  </div>

                  <div className="widget-content">
                    <div className="products-list">
                      {liveProducts.length > 0 ? (
                        liveProducts.map((product, index) => (
                          <div
                            key={product.id || index}
                            className="demo-product-card"
                          >
                            {/* Top Images Section */}
                            <div className="demo-product-images">
                              <div className="demo-product-image">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title || "Product"}
                                  />
                                ) : (
                                  <div className="image-placeholder">
                                    <span>?</span>
                                    <small>No image</small>
                                  </div>
                                )}
                              </div>

                              <div className="demo-ai-frame">
                                <img
                                  alt={`AI Frame for ${product.title ||
                                    "Product"}`}
                                  className="demo-ai-frame-image"
                                  src={
                                    product.frame_url ||
                                    product.back_image ||
                                    "/assets/main-frame.png"
                                  }
                                />
                              </div>
                            </div>

                            {/* Product Details Section */}
                            <div className="demo-product-main">
                              <div className="demo-product-info">
                                <h4 className="demo-product-name">
                                  {product.title ||
                                    product.name ||
                                    "Unknown Product"}
                                </h4>

                                <div className="demo-product-actions">
                                  <button
                                    className="demo-download-button"
                                    title="Download product markup as JSON"
                                    onClick={() => handleDownload(product)}
                                  >
                                    ↓
                                  </button>
                                  <div className="demo-product-price">
                                    {product.price ? `$${product.price}` : ""}
                                  </div>
                                </div>

                                {/* Match Type */}
                                {product.matchType && (
                                  <div className="demo-match-text">
                                    <p>AI {product.matchType}</p>
                                  </div>
                                )}

                                {/* AI Explanation */}
                                <div className="demo-ai-description">
                                  <p>
                                    {product.explanation ||
                                      product.description ||
                                      `Detected ${product.title ||
                                        product.name ||
                                        "product"} in video stream.`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-products">
                          <p>No products detected yet...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!channel && (
            <div className="demo-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
                  </svg>
                </div>
                <h3>Ready to Start</h3>
                <p>
                  Select a channel above to begin the live shopping demo
                  experience
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
