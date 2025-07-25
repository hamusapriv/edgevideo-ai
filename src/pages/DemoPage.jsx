import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { channels } from "../data/channels";
import ChannelLogo from "../components/ChannelLogo";
import { initProductsFeature } from "../legacy/screen";
import { setChannelId, getChannelId } from "../legacy/modules/useChannelModule";
import "../styles/demoPage.css";
import { downloadProduct } from "../utils/downloadProduct";
import Hls from "hls.js";
import edgevideoIcon from "/assets/logo.png"; // Adjust path as needed
import "../styles/reset.css"; // Ensure reset styles are applied

export default function DemoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get channel from URL parameters, similar to /app route
  const urlChannelId = searchParams.get("channelId");
  const currentChannel = channels.find((c) => c.id === urlChannelId);

  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  // const navigate = useNavigate(); // no navigation needed
  const origin = window.location.origin;
  const videoRef = useRef(null);

  // Handle channel selection by updating URL parameters
  const handleSelectChannel = (c) => {
    console.log("Selecting channel:", c.name, "ID:", c.id);

    // Check for known problematic URLs
    if (c.streamUrl && c.streamUrl.includes("junk.m3u8")) {
      console.warn("Warning: This channel has a test/invalid stream URL");
    }

    // Clear any existing products when switching channels
    setLiveProducts([]);

    // Navigate to the demo page with the channel ID as URL parameter
    navigate(`/demo?channelId=${c.id}`);
  };

  const handleBackToChannels = () => {
    // Navigate back to demo page without channelId parameter
    navigate("/demo");
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

      // Only show products for the current channel
      if (
        currentChannel &&
        product.channel_id &&
        product.channel_id !== currentChannel.id
      ) {
        console.log(
          "Ignoring product from different channel:",
          product.channel_id,
          "vs",
          currentChannel.id
        );
        return;
      }

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
  }, [isWidgetVisible, currentChannel]);

  // Clean up URL parameters and initialize WebSocket system on component mount
  useEffect(() => {
    // Clear non-channelId URL params on mount
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get("channelId"); // Preserve channelId

    // Create clean params with only channelId if it exists
    const cleanParams = new URLSearchParams();
    if (channelId) {
      cleanParams.set("channelId", channelId);
    }

    const newSearch = cleanParams.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : "");

    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, document.title, newUrl);
    }

    // Initialize the WebSocket system once when the component mounts
    // This will handle channel changes automatically through the channel-changed event
    initProductsFeature();

    // Cleanup function to run when component unmounts
    return () => {
      // Clear channel ID when leaving demo page
      setChannelId(null);
    };
  }, []);

  // Handle URL-based channel changes
  useEffect(() => {
    if (urlChannelId) {
      // Channel selected via URL - set it in the legacy system
      console.log("Setting channel from URL:", urlChannelId);
      setChannelId(urlChannelId);
      setLiveProducts([]); // Clear products when channel changes
    } else {
      // No channel in URL - clear the channel
      setChannelId(null);
      setLiveProducts([]);
    }
  }, [urlChannelId]);

  useEffect(() => {
    if (!currentChannel) return;
    const video = videoRef.current;
    if (!video) return;

    console.log("Loading video for channel:", currentChannel.name);

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

      // HLS event handlers - minimal logging
      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        // Media attached silently
      });

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Manifest parsed silently
      });

      hlsInstance.on(Hls.Events.LEVEL_LOADED, () => {
        // Level loaded silently
      });

      hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
        // Fragment loaded successfully - stream is working
        if (videoLoading) {
          setVideoLoading(false);
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error for", currentChannel.name, ":", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error for:", currentChannel.name);
              setVideoError(
                `Network error: Cannot load stream for ${currentChannel.name}`
              );
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(
                "Fatal media error for:",
                currentChannel.name,
                "attempting recovery"
              );
              try {
                hlsInstance.recoverMediaError();
              } catch (err) {
                setVideoError(
                  `Media error: Cannot play stream for ${currentChannel.name}`
                );
              }
              break;
            default:
              console.error("Fatal error for:", currentChannel.name);
              setVideoError(`Stream error: Cannot load ${currentChannel.name}`);
              hlsInstance.destroy();
              break;
          }
        } else {
          // Non-fatal error, log but don't show error to user
          console.warn("Non-fatal HLS error for:", currentChannel.name, data);
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
        <p>Experience AI-powered product detection in real-time</p>
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
                      onLoadStart={() => {
                        // Video element load start silently
                      }}
                      onCanPlay={() => {
                        // Video element can play silently
                      }}
                      onPlay={() => {
                        // Video started playing silently
                      }}
                      onPause={() => {
                        // Video paused silently
                      }}
                      onWaiting={() => {
                        // Video waiting for data silently
                      }}
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
                            data-product-id={product.id}
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
