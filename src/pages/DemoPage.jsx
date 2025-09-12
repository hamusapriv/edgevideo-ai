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

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const dropdownRef = useRef(null);

  // WebSocket URL
  const wsUrl = "wss://slave-ws-service-342233178764.us-west1.run.app";

  // Initialize WebSocket connection
  const initWebSocket = (channelId) => {
    if (!channelId) return;

    // Close existing connection and clear any pending reconnections
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnection attempts
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear products immediately when initializing new WebSocket
    setLiveProducts([]);
    setWsConnected(false);
    setAiStatus("Connecting...");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Double-check this is still the current WebSocket
      if (wsRef.current !== ws) {
        ws.close();
        return;
      }

      setWsConnected(true);
      setAiStatus("Connected - Listening for products...");

      // Subscribe to channel for real products only
      ws.send(JSON.stringify({ subscribe: `product-${channelId}` }));
      ws.send(JSON.stringify({ subscribe: `shopping-ai-status-${channelId}` }));
    };

    ws.onmessage = (event) => {
      // Double-check this is still the current WebSocket
      if (wsRef.current !== ws) {
        return;
      }

      try {
        const data = JSON.parse(event.data);

        if (data.ai) {
          setAiStatus(data.ai);
        } else if (data.id) {
          // Real product from WebSocket - verify it's for the current channel
          addProduct(data, channelId);
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      // Only handle close if this is still the current WebSocket
      if (wsRef.current !== ws) {
        return;
      }

      setWsConnected(false);
      setAiStatus("Disconnected");

      // Attempt to reconnect after 5 seconds only if we still have the same channel
      setTimeout(() => {
        if (
          wsRef.current === ws &&
          currentChannel &&
          currentChannel.id === channelId
        ) {
          initWebSocket(channelId);
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      // Only handle error if this is still the current WebSocket
      if (wsRef.current !== ws) {
        return;
      }

      console.error("Demo WebSocket error:", error);
      setWsConnected(false);
      setAiStatus("Connection Error");
    };
  };

  // Add product to the list (REAL products only)
  const addProduct = (product, expectedChannelId) => {
    if (!product || !currentChannel) return;

    // Verify the product is for the current channel to prevent cross-channel contamination
    if (expectedChannelId && currentChannel.id !== expectedChannelId) {
      return;
    }

    setLiveProducts((prev) => {
      // Check if product already exists
      if (prev.some((p) => p.id === product.id)) return prev;

      // Add new product to the beginning, keep max 15 products
      const updated = [product, ...prev].slice(0, 15);

      return updated;
    });

    // Show widget when first product arrives
    if (!isWidgetVisible) {
      setIsWidgetVisible(true);
    }
  };

  // Handle channel selection
  const handleSelectChannel = (c) => {
    // Close current WebSocket immediately to prevent race conditions
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnection attempts
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear products and reset state immediately
    setLiveProducts([]);
    setIsWidgetVisible(false);
    setWsConnected(false);
    setAiStatus("Switching channels...");

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

  // Custom dropdown handlers
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleChannelSelect = (channel) => {
    setIsDropdownOpen(false);
    handleSelectChannel(channel);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Product widget functionality
  const handleDownload = async (product) => {
    await downloadProduct(product);
  };

  // Initialize WebSocket when channel changes
  useEffect(() => {
    // Close any existing WebSocket first
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnection attempts
      wsRef.current.close();
      wsRef.current = null;
    }

    if (urlChannelId) {
      // Clear products first, then initialize WebSocket
      setLiveProducts([]);
      setWsConnected(false);
      setAiStatus("Connecting...");

      // Small delay to ensure state is cleared before connecting
      setTimeout(() => {
        initWebSocket(urlChannelId);
      }, 100);
    } else {
      setLiveProducts([]);
      setWsConnected(false);
      setAiStatus("No Channel Selected");
    }

    // Cleanup on unmount or channel change
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnection attempts
        wsRef.current.close();
        wsRef.current = null;
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
        if (data.fatal) {
          console.error("HLS Fatal Error:", data);
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
        <label htmlFor="channelSelect">Select Channel</label>
        <div className="custom-dropdown" ref={dropdownRef}>
          <div
            className={`dropdown-trigger ${isDropdownOpen ? "open" : ""}`}
            onClick={toggleDropdown}
          >
            {currentChannel ? (
              <div className="selected-channel-display">
                <ChannelLogo
                  channelId={currentChannel.id}
                  className="channel-icon-small"
                />
                <span>{currentChannel.name}</span>
              </div>
            ) : (
              <span className="placeholder-text">
                Choose a channel to start
              </span>
            )}
            <div
              className={`dropdown-arrow ${isDropdownOpen ? "rotated" : ""}`}
            >
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

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <span>Available Channels</span>
              </div>
              <div className="dropdown-options">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`dropdown-option ${
                      currentChannel?.id === channel.id ? "selected" : ""
                    }`}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <div className="channel-icon-container">
                      <ChannelLogo
                        channelId={channel.id}
                        className="channel-icon-bg"
                      />
                      <ChannelLogo
                        channelId={channel.id}
                        className="channel-icon"
                      />
                    </div>
                    <div className="channel-info">
                      <span className="channel-name">{channel.name}</span>
                      <span className="channel-description">
                        {channel.description || "Live streaming channel"}
                      </span>
                    </div>
                    {currentChannel?.id === channel.id && (
                      <div className="selected-indicator">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
                </div>

                {/* Inline Product Widget */}
                <div
                  className={`demo-product-widget ${
                    isWidgetVisible ? "visible" : ""
                  }`}
                >
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
                                {/* Match Type */}
                                {product.matchType && (
                                  <span>AI {product.matchType}</span>
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
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                              }}
                            >
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
                              </div>{" "}
                              <div className="demo-product-actions">
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                  }}
                                >
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
                                {product.price && (
                                  <div className="demo-product-price">
                                    ${product.price}
                                  </div>
                                )}
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
