import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import "../styles/HomePage.css";
import "../styles/marketing-theme.css";
import "../styles/home-auth.css";
import "../styles/google.css";
import "../styles/FloatingProfile.css";
import HeroImg from "/assets/hero-image.png";
import HeroVideoMp4 from "/assets/hero-video-min.mp4";
import HeroVideoWebm from "/assets/output_alpha.webm";
import useIsMobile from "../hooks/useIsMobile";
import MarketingBG from "../components/MarketingBG";

// Lazy load heavy components
const AnimatedStat = lazy(() => import("../components/AnimatedStat"));
const ScrollToTopButton = lazy(() => import("../components/ScrollToTopButton"));
const Footer = lazy(() => import("../components/Footer"));

// Lazy load SVG icons
const TelegramIcon = lazy(() => import("../components/svgs/TelegramIcon"));
const TwitterIcon = lazy(() => import("../components/svgs/TwitterIcon"));
const LinkedInIcon = lazy(() => import("../components/svgs/LinkedInIcon"));
const YouTubeIcon = lazy(() => import("../components/svgs/YouTubeIcon"));
const MediumIcon = lazy(() => import("../components/svgs/MediumIcon"));
const FastSetupIcon = lazy(() => import("../components/svgs/FastSetupIcon"));
const GamificationIcon = lazy(() =>
  import("../components/svgs/GamificationIcon")
);
const RewardsIcon = lazy(() => import("../components/svgs/RewardsIcon"));
const AnalyticsIcon = lazy(() => import("../components/svgs/AnalyticsIcon"));
const VideoAnalyticsIcon = lazy(() =>
  import("../components/svgs/VideoAnalyticsIcon")
);
const RevenueStreamIcon = lazy(() =>
  import("../components/svgs/RevenueStreamIcon")
);
const ViewerEngagementIcon = lazy(() =>
  import("../components/svgs/ViewerEngagementIcon")
);

// Keep critical components as regular imports
import Navbar from "../components/Navbar";
import LazyImage from "../components/LazyImage";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";

// Lazy load example pairs only when needed
const loadExamplePairs = () => {
  return [
    {
      frame: "/assets/frame-product-pairs/Frame-Image-1.png",
      product: "/assets/frame-product-pairs/product-1.png",
      frameAlt: "Frame 1",
      productAlt: "Product 1",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-2.png",
      product: "/assets/frame-product-pairs/product-2.png",
      frameAlt: "Frame 2",
      productAlt: "Product 2",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-3.png",
      product: "/assets/frame-product-pairs/product-3.png",
      frameAlt: "Frame 3",
      productAlt: "Product 3",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-4.png",
      product: "/assets/frame-product-pairs/product-4.png",
      frameAlt: "Frame 4",
      productAlt: "Product 4",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-5.png",
      product: "/assets/frame-product-pairs/product-5.png",
      frameAlt: "Frame 5",
      productAlt: "Product 5",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-6.png",
      product: "/assets/frame-product-pairs/product-6.png",
      frameAlt: "Frame 6",
      productAlt: "Product 6",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-7.png",
      product: "/assets/frame-product-pairs/product-7.png",
      frameAlt: "Frame 7",
      productAlt: "Product 7",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-8.png",
      product: "/assets/frame-product-pairs/product-8.png",
      frameAlt: "Frame 8",
      productAlt: "Product 8",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-9.png",
      product: "/assets/frame-product-pairs/product-9.png",
      frameAlt: "Frame 9",
      productAlt: "Product 9",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-10.png",
      product: "/assets/frame-product-pairs/product-10.png",
      frameAlt: "Frame 10",
      productAlt: "Product 10",
    },
    {
      frame: "/assets/frame-product-pairs/Frame-Image-11.png",
      product: "/assets/frame-product-pairs/product-11.png",
      frameAlt: "Frame 11",
      productAlt: "Product 11",
    },
  ];
};

const testimonials = [
  {
    quote:
      "Edge Video's AI is revolutionizing Shoppable TV, letting you buy what you see on-screen instantly. It's transforming ads into instant shopping experiences, making them super effective by connecting you with what you want, right when you want it.",
    author: "Ralf Jacob",
    role: "EVP Broadcast Operations & Technology for TelevisaUnivision",
  },
  {
    quote:
      "Edge Video's new AI-powered interactive TV is changing the game, turning passive watching into an engaging experience. It's all about getting viewers involved, boosting their happiness and loyalty. Edge Video is at the forefront, with AI making TV way more interactive and fun.",
    author: "Alex Duka",
    role: "Advisor and Board Member, former Managing Director, Citigroup",
  },
  {
    quote: "Edge-AI is the most exciting product for video, since the drone.",
    author: "Joshua Elmore",
    role: "Sr. Director Content Operations, The Weather Channel",
  },
  {
    quote:
      "Edge Video blends web2 and web3 to transform shopping and gaming with interactive streams, boosting engagement and pioneering in digital entertainment. Their use of blockchain enhances the user experience, setting new standards in the online world.",
    author: "Neil Wolfson",
    role:
      "Active Board Member and Venture Investor, Former Partner at KPMG and Former President of Wilmington Trust Investment Management",
  },
  {
    quote:
      "Edge Video's Web3 rewards are revolutionizing viewer loyalty with a blend of blockchain and AI, making rewards secure, transparent, and trustworthy. This fresh take is transforming how viewers engage and trust in the digital era.",
    author: "Richard Entrup",
    role: "Managing Director, Enterprise Innovation @ KPMG US",
  },
  {
    quote:
      "Edge Video's AI is flipping the script on streaming, turning your screen time into shopping time. Now, watching TV also means you can shop directly from your couch, opening up cool new earning avenues for creators and brands. It's like making your lazy TV time a shopping adventure!",
    author: "Jeffrey Hayzlett",
    role:
      "Chairman, C-Suite Network Primetime Television & Podcast Host, Former CMO, Kodak",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [typedText, setTypedText] = useState("");
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [examplePairs, setExamplePairs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const isMobile = useIsMobile();
  const fullText = "The man in the video is wearing a royal blue t-shirt";

  // Load testimonials lazily
  useEffect(() => {
    const loadTestimonials = () => [
      {
        quote:
          "Edge Video's AI is revolutionizing Shoppable TV, letting you buy what you see on-screen instantly. It's transforming ads into instant shopping experiences, making them super effective by connecting you with what you want, right when you want it.",
        author: "Ralf Jacob",
        role: "EVP Broadcast Operations & Technology for TelevisaUnivision",
      },
      {
        quote:
          "Edge Video's new AI-powered interactive TV is changing the game, turning passive watching into an engaging experience. It's all about getting viewers involved, boosting their happiness and loyalty. Edge Video is at the forefront, with AI making TV way more interactive and fun.",
        author: "Alex Duka",
        role: "Advisor and Board Member, former Managing Director, Citigroup",
      },
      {
        quote:
          "Edge-AI is the most exciting product for video, since the drone.",
        author: "Joshua Elmore",
        role: "Sr. Director Content Operations, The Weather Channel",
      },
      {
        quote:
          "Edge Video blends web2 and web3 to transform shopping and gaming with interactive streams, boosting engagement and pioneering in digital entertainment. Their use of blockchain enhances the user experience, setting new standards in the online world.",
        author: "Neil Wolfson",
        role:
          "Active Board Member and Venture Investor, Former Partner at KPMG and Former President of Wilmington Trust Investment Management",
      },
      {
        quote:
          "Edge Video's Web3 rewards are revolutionizing viewer loyalty with a blend of blockchain and AI, making rewards secure, transparent, and trustworthy. This fresh take is transforming how viewers engage and trust in the digital era.",
        author: "Richard Entrup",
        role: "Managing Director, Enterprise Innovation @ KPMG US",
      },
      {
        quote:
          "Edge Video's AI is flipping the script on streaming, turning your screen time into shopping time. Now, watching TV also means you can shop directly from your couch, opening up cool new earning avenues for creators and brands. It's like making your lazy TV time a shopping adventure!",
        author: "Jeffrey Hayzlett",
        role:
          "Chairman, C-Suite Network Primetime Television & Podcast Host, Former CMO, Kodak",
      },
    ];

    // Load data after a short delay to prioritize initial render
    const timer = setTimeout(() => {
      setTestimonials(loadTestimonials());
      setExamplePairs(loadExamplePairs());
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadVideo(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Video loading handlers
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setVideoLoaded(false);
  };

  const retryVideoLoad = () => {
    setVideoError(false);
    setShouldLoadVideo(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  useEffect(() => {
    let index = 0;
    const typeTimer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        // Reset after a pause
        setTimeout(() => {
          index = 0;
        }, 2000);
      }
    }, 60);

    return () => clearInterval(typeTimer);
  }, []);

  return (
    <div className="home marketing-page">
      <MarketingBG />
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title" style={{ lineHeight: "1.2" }}>
                <span>Join the </span>
                <br />
                <span className="hero-highlight" style={{ margin: "-12px 0" }}>
                  Shoppable Video
                </span>
                <br />
                <span>Revolution</span>{" "}
              </h1>
              <p className="hero-description">
                Our AI-powered shoppable broadcasting solution adds a new
                dimension to any video stream and allows viewers to purchase
                items in real-time from their favorite shows - without leaving
                the screen.
              </p>
              <div className="hero__actions">
                <a
                  href="mailto:info@edgevideo.ai"
                  className="btn btn--secondary"
                >
                  Contact Us
                </a>
                {user && wallet.isVerified && (
                  <a href="/app" className="btn btn--primary">
                    Enter App
                  </a>
                )}
              </div>
            </div>
            {/*           <img src={HeroImg} className="hero__image" /> */}
            <div className="hero-video-container" ref={containerRef}>
              {!videoLoaded && !videoError && (
                <div className="video-loading">
                  <img
                    src={HeroImg}
                    alt="Loading..."
                    className="video-poster"
                  />
                  {shouldLoadVideo && (
                    <div className="video-loading-spinner"></div>
                  )}
                </div>
              )}

              {videoError && (
                <div className="video-error">
                  <img
                    src={HeroImg}
                    alt="Video unavailable"
                    className="video-poster"
                  />
                  <button onClick={retryVideoLoad} className="video-retry-btn">
                    Retry Video
                  </button>
                </div>
              )}

              {shouldLoadVideo && (
                <video
                  ref={videoRef}
                  className={`hero-video ${videoLoaded ? "loaded" : ""}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  webkit-playsinline="true"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  poster={HeroImg}
                  preload={isMobile ? "none" : "metadata"}
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                  style={{
                    opacity: videoLoaded ? 1 : 0,
                    background: "transparent",
                    backgroundColor: "transparent",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <source src={HeroVideoWebm} type="video/webm" />
                  <source src={HeroVideoMp4} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </section>

        <section className="simple-section container">
          <h2>Yes. It's Really That Simple</h2>
          <div className="simple-content">
            <div className="simple-item">
              <div className="simple-icon">
                <Suspense
                  fallback={<div style={{ width: "64px", height: "64px" }} />}
                >
                  <VideoAnalyticsIcon size={64} color="#617afa" />
                </Suspense>
              </div>
              <p>
                Our advanced AI solution identifies products and tickets within
                real-time video streams, displaying them on viewers' devices for
                a seamless shopping experience.
              </p>
            </div>
            <div className="simple-item">
              <div className="simple-icon">
                <Suspense
                  fallback={<div style={{ width: "64px", height: "64px" }} />}
                >
                  <RevenueStreamIcon size={64} color="#617afa" />
                </Suspense>
              </div>
              <p>
                Each product sold based on your stream earns you a commission.
                Simply add an additional revenue stream - easy to integrate with
                Linear, FAST and Live channels.
              </p>
            </div>
            <div className="simple-item">
              <div className="simple-icon">
                <Suspense
                  fallback={<div style={{ width: "64px", height: "64px" }} />}
                >
                  <ViewerEngagementIcon size={64} color="#617afa" />
                </Suspense>
              </div>
              <p>
                Finally get to know your viewers - and reward them for shopping
                and interacting with your stream. Powered by our rewards system
                and innovative web3 ecosystem.
              </p>
            </div>
          </div>
        </section>

        <section className="how-it-works container">
          <div className="how-it-works-header">
            <h2>Here's How It Works.</h2>
            <p className="how-it-works-subtitle">
              Watch. Scan. Shop. Seamlessly integrate AI-powered shopping into
              your video content and enable viewers to watch and shop without
              missing a minute of your content.
            </p>
          </div>

          {/* New Interactive Steps Demo */}
          <div className="steps-demo">
            <div className="steps-showcase">
              {/* Step 1: Watch Video Stream */}
              <div className="step-showcase step-1">
                <div className="step-header">
                  <div className="step-number">01</div>
                  <div className="step-info">
                    <h3>Watch Any Video Stream</h3>
                    <p>
                      Experience seamless entertainment across all your favorite
                      content
                    </p>
                  </div>
                </div>
                <div className="step-visual">
                  <div className="tv-frame">
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <LazyImage
                        src="/assets/stream.png"
                        alt="TV Screen"
                        className="tv-screen"
                      />
                      <div className="video-controls-overlay">
                        <div className="video-controls">
                          <button className="play-button">
                            <div className="play-icon"></div>
                          </button>
                          <div className="video-progress">
                            <div className="progress-bar"></div>
                          </div>
                          <span className="video-time">2:34 / 7:21</span>
                        </div>
                        <div className="video-controls-icons">
                          <div className="control-icon volume-icon"></div>
                          <div className="control-icon fullscreen-icon"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Scan QR Code */}
              <div className="step-showcase step-2">
                <div className="step-header">
                  <div className="step-number">02</div>
                  <div className="step-info">
                    <h3>Scan QR Code</h3>
                    <p>Quick and easy access to shopping interface</p>
                  </div>
                </div>
                <div className="step-visual">
                  <div className="qr-container">
                    <LazyImage
                      src="/assets/scan-qr-code.png"
                      alt="QR Code Scan"
                      className="qr-image"
                    />
                    <div className="scan-hint">Scan with your phone</div>
                  </div>
                </div>
              </div>

              {/* Step 3: AI Recognition - Interactive Demo */}
              <div className="step-showcase step-3">
                <div className="step-header">
                  <div className="step-number">03</div>
                  <div className="step-info">
                    <h3>What Our AI Saw</h3>
                    <p>
                      Advanced AI recognizes products instantly from video
                      frames
                    </p>
                  </div>
                </div>
                <div className="step-visual">
                  <div className="ai-demo-container">
                    <div className="frame-analysis">
                      <div className="video-frame">
                        <img
                          src="/assets/main-frame.png"
                          alt="Video Frame"
                          className="frame-image"
                        />
                        <div className="ai-scanning-overlay">
                          <div className="scan-grid"></div>
                          <div className="detection-boxes">
                            <div className="detection-box box-1"></div>
                            <div className="detection-box box-2"></div>
                          </div>
                        </div>
                      </div>
                      <div className="analysis-arrow">→</div>
                      <div className="ai-query-visual">
                        <div className="ai-query-text">
                          <span className="typing-text">{typedText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Product Matching - Before/After */}
              <div className="step-showcase step-4">
                <div className="step-header">
                  <div className="step-number">04</div>
                  <div className="step-info">
                    <h3>Product Matched</h3>
                    <p>Perfect matches found in real-time from our database</p>
                  </div>
                </div>
                <div className="step-visual">
                  <div className="matching-demo">
                    <div className="frame-product-pair">
                      <div className="detected-in-frame">
                        <img
                          src="/assets/main-frame.png"
                          alt="Detected Frame"
                        />
                        <div className="match-label">Detected in Video</div>
                      </div>
                      <div className="match-connector">
                        <div className="dots-animation">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                      <div className="matched-product">
                        <img
                          src="/assets/main-product.png"
                          alt="Matched Product"
                        />
                        <div className="match-label">Found in Database</div>
                        <div className="confidence-score">98% Match</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Shop and Enjoy */}
              <div className="step-showcase step-5">
                <div className="step-header">
                  <div className="step-number">05</div>
                  <div className="step-info">
                    <h3>Shop and Enjoy</h3>
                    <p>
                      Complete your purchase seamlessly without leaving the
                      experience
                    </p>
                  </div>
                </div>
                <div className="step-visual">
                  <div className="shopping-interface">
                    <div className="product-card-demo">
                      <img
                        src="/assets/main-product.png"
                        alt="Product to Buy"
                      />
                      <div className="product-info">
                        <h4>Product Found!</h4>
                        <div className="price">$49.99</div>
                        <button className="buy-button">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Examples Gallery */}
            <div className="examples-gallery">
              <h3>See More Real Examples</h3>
              <div className="examples-slider">
                <div className="examples-track">
                  {examplePairs.concat(examplePairs).map((item, index) => (
                    <div key={index} className="example-pair">
                      <div className="example-frame">
                        <img src={item.frame} alt={item.frameAlt} />
                      </div>
                      <div className="example-arrow">→</div>
                      <div className="example-product">
                        <img src={item.product} alt={item.productAlt} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="how-it-works-description">
            <p>
              Whether you're broadcasting live, linear, or FAST content,
              Shoppable TV helps you turn passive audiences into active and
              engaged consumers.
            </p>
            <p>
              Increase viewer retention and dwell time, while opening new
              monetization avenues—without disrupting the content experience!
            </p>
            <p>
              Shoppable TV adds a new dimension to your platform, allowing
              viewers to purchase items directly from their favorite shows,
              without leaving the screen.
            </p>
          </div>
        </section>

        <section className="features container">
          <h2>What Edge Video AI delivers.</h2>

          <div className="features-content">
            <div className="features-wrapper">
              <div className="feature-card feature-1">
                <div className="feature-icon">
                  <Suspense
                    fallback={<div style={{ width: "96px", height: "96px" }} />}
                  >
                    <FastSetupIcon size={96} />
                  </Suspense>
                </div>
                <h3>
                  Fast, easy set-up at no cost. We just require your feed.
                </h3>
              </div>
              <div className="feature-card feature-2">
                <div className="feature-icon">
                  <Suspense
                    fallback={<div style={{ width: "96px", height: "96px" }} />}
                  >
                    <GamificationIcon size={96} />
                  </Suspense>
                </div>
                <h3>
                  Gamification adds additional "stickiness" to your content.
                </h3>
              </div>
            </div>

            <div className="features-center">
              <div className="features-demo-container">
                <div className="central-graphic">
                  <div className="ai-brain">
                    <div className="brain-core">
                      <div className="ai-pulse"></div>
                      <div className="ai-text">AI</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="features-wrapper">
              <div className="feature-card feature-3">
                <div className="feature-icon">
                  <Suspense
                    fallback={<div style={{ width: "96px", height: "96px" }} />}
                  >
                    <RewardsIcon size={96} />
                  </Suspense>
                </div>
                <h3>Reward your viewers for interacting with your content.</h3>
              </div>
              <div className="feature-card feature-4">
                <div className="feature-icon">
                  <Suspense
                    fallback={<div style={{ width: "96px", height: "96px" }} />}
                  >
                    <AnalyticsIcon size={96} />
                  </Suspense>
                </div>
                <h3>
                  We provide data insights of your viewers to help your ad
                  spend.
                </h3>
              </div>
            </div>
          </div>
        </section>

        <section className="testimonials container">
          <h2>Here is what others have to say.</h2>
          <div className="testimonials-slider">
            <div className="testimonials-track">
              {testimonials.concat(testimonials).map((t, index) => (
                <div key={index} className="testimonial">
                  <blockquote>{t.quote}</blockquote>
                  <div className="testimonial-author">
                    <strong>{t.author}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="stats container">
          <h2>Edge Video AI in Numbers.</h2>
          <div className="stats-grid">
            <Suspense
              fallback={
                <div
                  style={{
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Loading...
                </div>
              }
            >
              <AnimatedStat number={12} label="Channels" delay={0} />
              <AnimatedStat number={21527} label="Vendors" delay={200} />
              <AnimatedStat number={17415854} label="Products" delay={400} />
            </Suspense>
          </div>
          <p className="stats-date">Per June 2025</p>
        </section>

        <section className="cta-section container">
          <h2>
            Ready to Get Started with <br />{" "}
            <span className="hero-highlight">Shoppable TV?</span>
          </h2>
          <a
            href="mailto:info@edgevideo.ai"
            className="btn btn--primary btn--large"
          >
            Contact Us
          </a>
        </section>

        <section className="social container">
          <h3>Join Us.</h3>
          <ul className="social__list">
            <li className="social__item">
              <a
                href="https://t.me/edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Suspense
                  fallback={<div style={{ width: "24px", height: "24px" }} />}
                >
                  <TelegramIcon size={24} color="white" />
                </Suspense>
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://twitter.com/edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Suspense
                  fallback={<div style={{ width: "24px", height: "24px" }} />}
                >
                  <TwitterIcon size={24} color="white" />
                </Suspense>
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://www.linkedin.com/company/edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Suspense
                  fallback={<div style={{ width: "24px", height: "24px" }} />}
                >
                  <LinkedInIcon size={24} color="white" />
                </Suspense>
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://www.youtube.com/@edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Suspense
                  fallback={<div style={{ width: "24px", height: "24px" }} />}
                >
                  <YouTubeIcon size={24} color="white" />
                </Suspense>
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://medium.com/edge-video-ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Suspense
                  fallback={<div style={{ width: "24px", height: "24px" }} />}
                >
                  <MediumIcon size={24} color="white" />
                </Suspense>
              </a>
            </li>
          </ul>
        </section>
      </main>
      <Suspense fallback={<div style={{ height: "200px" }} />}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <ScrollToTopButton />
      </Suspense>
    </div>
  );
}
