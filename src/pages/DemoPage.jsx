import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { channels } from "../data/channels";
import ChannelLogo from "../components/ChannelLogo";
import "../styles/demoPage.css";
import { downloadProduct } from "../utils/downloadProduct";
import Hls from "hls.js";
import edgevideoIcon from "/assets/logo.png";
import "../styles/reset.css";

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get channel from URL parameters
  const urlChannelId = searchParams.get("channelId");
  const currentChannel = channels.find((c) => c.id === urlChannelId);

  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [aiStatus, setAiStatus] = useState("Connecting...");

  const videoRef = useRef(null);
  const wsRef = useRef(null);

  // WebSocket URL
  const wsUrl = "wss://slave-ws-service-342233178764.us-west1.run.app";

  // Initialize WebSocket connection
  const initWebSocket = (channelId) => {
    if (!channelId) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Demo WebSocket connected");
      setWsConnected(true);
      setAiStatus("Connected - Listening for products...");

      // Subscribe to channel for real products only
      ws.send(JSON.stringify({ subscribe: `product-${channelId}` }));
      ws.send(JSON.stringify({ subscribe: `shopping-ai-status-${channelId}` }));

      console.log(`Demo: Subscribed to real products for channel ${channelId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.ai) {
          setAiStatus(data.ai);
          console.log(`Demo: AI status update - ${data.ai}`);
        } else if (data.id) {
          // Real product from WebSocket
          console.log("Demo: Received real product from WebSocket:", data);
          addProduct(data);
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("Demo WebSocket disconnected");
      setWsConnected(false);
      setAiStatus("Disconnected");

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (currentChannel) {
          initWebSocket(currentChannel.id);
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("Demo WebSocket error:", error);
      setWsConnected(false);
      setAiStatus("Connection Error");
    };
  };

  // Add product to the list (REAL products only)
  const addProduct = (product) => {
    if (!product || !currentChannel) return;

    setLiveProducts((prev) => {
      // Check if product already exists
      if (prev.some((p) => p.id === product.id)) return prev;

      // Add new product to the beginning, keep max 15 products
      const updated = [product, ...prev].slice(0, 15);
      console.log(
        `Demo: Added REAL product ${product.title ||
          product.name} for channel ${currentChannel.name}`
      );

      return updated;
    });

    // Show widget when first product arrives
    if (!isWidgetVisible) {
      setIsWidgetVisible(true);
    }
  };

  // Handle channel selection
  const handleSelectChannel = (c) => {
    console.log(`Demo: Switching to channel ${c.id} (${c.name})`);

    // Clear products and reset state
    setLiveProducts([]);
    setIsWidgetVisible(false);
    setAiStatus("Connecting...");

    // Navigate to the demo page with the channel ID
    navigate(`/demo?channelId=${c.id}`);

    // Re-show widget after channel switch
    setTimeout(() => {
      setIsWidgetVisible(true);
    }, 500);
  };

  const handleBackToChannels = () => {
    navigate("/demo");
  };

  // Product widget functionality
  const handleDownload = async (product) => {
    await downloadProduct(product);
  };

  // Initialize WebSocket when channel changes
  useEffect(() => {
    if (urlChannelId) {
      console.log(`Demo: URL channel changed to ${urlChannelId}`);
      initWebSocket(urlChannelId);
    } else {
      console.log("Demo: No channel in URL, clearing");
      // Close WebSocket if no channel
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setLiveProducts([]);
      setWsConnected(false);
      setAiStatus("No Channel Selected");
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [urlChannelId]);

  // Video handling
  useEffect(() => {
    if (!currentChannel) return;
    const video = videoRef.current;
    if (!video) return;

    setVideoLoading(true);
    setVideoError(null);

    // Handle YouTube embeds (like EuroNews)
    if (currentChannel.isYouTubeEmbed && currentChannel.youtubeUrl) {
      setVideoLoading(false);
      return;
    }

    // Store reference to HLS instance for cleanup
    let hlsInstance = null;

    // Clear any previous sources
    video.src = "";
    video.load();

    // Check if URL is valid
    if (
      !currentChannel.streamUrl ||
      currentChannel.streamUrl.includes("junk.m3u8")
    ) {
      setVideoError("Invalid stream URL for this channel");
      setVideoLoading(false);
      return;
    }

    // Video event listeners
    const handleLoadStart = () => setVideoLoading(true);
    const handleCanPlay = () => setVideoLoading(false);
    const handleVideoError = (e) => {
      console.error("Video element error:", e, video.error);
      setVideoError(video.error?.message || "Failed to load video");
      setVideoLoading(false);
    };
    const handleLoadedData = () => setVideoLoading(false);

    // Add event listeners
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleVideoError);
    video.addEventListener("loadeddata", handleLoadedData);

    // Try native HLS support first (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentChannel.streamUrl;
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
      hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
        if (videoLoading) {
          setVideoLoading(false);
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error for", currentChannel.name, ":", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setVideoError(
                `Network error: Cannot load stream for ${currentChannel.name}`
              );
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try {
                hlsInstance.recoverMediaError();
              } catch (err) {
                setVideoError(
                  `Media error: Cannot play stream for ${currentChannel.name}`
                );
              }
              break;
            default:
              setVideoError(`Stream error: Cannot load ${currentChannel.name}`);
              hlsInstance.destroy();
              break;
          }
        }
        setVideoLoading(false);
      });

      // Load the stream
      hlsInstance.loadSource(currentChannel.streamUrl);
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
  }, [currentChannel]);

  return (
    <div className="demo-page">
      {/* Hero Section */}
      <div className="demo-hero">
        <Link to="/" className="demo-logo">
          <img src={edgevideoIcon} alt="EdgeVideo AI" />
          <span>EdgeVideo AI</span>
        </Link>
        <h1>Live Shopping Demo</h1>
        <p>
          Experience AI-powered product detection with REAL products in
          real-time
        </p>
      </div>

      {/* Channel Selection */}
      <div className="demo-channel-section">
        <div className="channel-selector">
          <label htmlFor="channelSelect">Select Channel</label>
          <div className="select-wrapper">
            <select
              id="channelSelect"
              value={currentChannel?.id || ""}
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

        {currentChannel && (
          <div className="selected-channel">
            <ChannelLogo
              channelId={currentChannel.id}
              className="channel-icon"
            />
            <div className="channel-details">
              <span className="channel-name">{currentChannel.name}</span>
              <span className="channel-status">
                <span className="status-indicator"></span>
                {wsConnected ? "Live" : "Connecting..."}
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
          {currentChannel && (
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
                  {currentChannel.isYouTubeEmbed &&
                  currentChannel.youtubeUrl ? (
                    <iframe
                      src={currentChannel.youtubeUrl}
                      title={`${currentChannel.name} Live Stream`}
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
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>

              <div className="widget-container">
                {/* AI Status */}
                <div className="ai-status-header">
                  <div className="ai-status-indicator">
                    <div
                      className={`status-dot ${
                        wsConnected ? "connected" : "disconnected"
                      }`}
                    ></div>
                    <span>AI Status: {aiStatus}</span>
                  </div>
                </div>

                {/* Inline Product Widget */}
                <div
                  className={`demo-product-widget ${
                    isWidgetVisible ? "visible" : ""
                  }`}
                >
                  <div className="widget-header">
                    <div className="widget-header-content">
                      <h3>Live Shopping - Real Products</h3>
                      <div className="widget-status">
                        <div className="status-indicator"></div>
                        <span>
                          {liveProducts.length} product
                          {liveProducts.length !== 1 ? "s" : ""} detected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="widget-content">
                    <div className="products-list">
                      {liveProducts.length > 0 ? (
                        liveProducts.map((product, index) => (
                          <div
                            key={product.id || index}
                            className={`demo-product-card ${
                              index === 0 ? "latest" : ""
                            }`}
                            data-product-id={product.id}
                            style={{
                              animationDelay: `${index * 0.1}s`,
                            }}
                          >
                            {/* New Product Badge */}
                            {index === 0 && (
                              <div className="new-product-badge">
                                <span>New</span>
                              </div>
                            )}

                            {/* Top Images Section */}
                            <div className="demo-product-images">
                              <div className="demo-product-image">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title || "Product"}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="image-placeholder">
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21,15 16,10 5,21" />
                                    </svg>
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
                                  loading="lazy"
                                />
                                <div className="ai-frame-overlay">
                                  <span>AI Detection</span>
                                </div>
                              </div>
                            </div>

                            {/* Product Details Section */}
                            <div className="demo-product-main">
                              <div className="demo-product-info">
                                <div className="demo-product-header">
                                  <h4 className="demo-product-name">
                                    {product.title ||
                                      product.name ||
                                      "Unknown Product"}
                                  </h4>

                                  {/* Match Type */}
                                  {product.matchType && (
                                    <div className="demo-match-badge">
                                      <span>AI {product.matchType}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="demo-product-actions">
                                  <button
                                    className="demo-download-button"
                                    title="Download product markup as JSON"
                                    onClick={() => handleDownload(product)}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="7,10 12,15 17,10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                  </button>

                                  {product.price && (
                                    <div className="demo-product-price">
                                      ${product.price}
                                    </div>
                                  )}

                                  {product.link && (
                                    <a
                                      href={product.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="demo-view-button"
                                      title="View product"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15,3 21,3 21,9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                      </svg>
                                    </a>
                                  )}
                                </div>

                                {/* AI Explanation */}
                                <div className="demo-ai-description">
                                  <p>
                                    {product.explanation ||
                                      product.description ||
                                      `Detected ${product.title ||
                                        product.name ||
                                        "product"} in video stream with AI recognition technology.`}
                                  </p>
                                </div>

                                {/* Additional Product Info */}
                                <div className="demo-product-meta">
                                  {product.domain_url && (
                                    <div className="demo-product-source">
                                      <span>Source: {product.domain_url}</span>
                                    </div>
                                  )}
                                  <div className="demo-product-timestamp">
                                    <span>
                                      Detected:{" "}
                                      {new Date().toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-products">
                          <div className="no-products-icon">
                            <svg
                              width="48"
                              height="48"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <circle cx="11" cy="11" r="8" />
                              <path d="M21 21l-4.35-4.35" />
                            </svg>
                          </div>
                          <h4>No products detected yet</h4>
                          <p>
                            AI is analyzing the video stream for REAL products.
                            Products will appear here when detected by our AI
                            system.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!currentChannel && (
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
