import React, { useState, useEffect } from "react";
import "../styles/HomePage.css";
import HeroImg from "/assets/hero-image.png";
import HeroImg2 from "/assets/hero-image-2.png";
import HeroVideoMp4 from "/assets/hero-video-min.mp4";
import HeroVideoWebm from "/assets/hero-video.webm";
import AnimatedStat from "../components/AnimatedStat";
import TelegramIcon from "../components/svgs/TelegramIcon";
import TwitterIcon from "../components/svgs/TwitterIcon";
import LinkedInIcon from "../components/svgs/LinkedInIcon";
import YouTubeIcon from "../components/svgs/YouTubeIcon";
import MediumIcon from "../components/svgs/MediumIcon";
import FastSetupIcon from "../components/svgs/FastSetupIcon";
import GamificationIcon from "../components/svgs/GamificationIcon";
import RewardsIcon from "../components/svgs/RewardsIcon";
import AnalyticsIcon from "../components/svgs/AnalyticsIcon";
import VideoAnalyticsIcon from "../components/svgs/VideoAnalyticsIcon";
import RevenueStreamIcon from "../components/svgs/RevenueStreamIcon";
import ViewerEngagementIcon from "../components/svgs/ViewerEngagementIcon";
import ScrollToTopButton from "../components/ScrollToTopButton";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HomePage() {
  const [typedText, setTypedText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const fullText = "The man in the video is wearing a royal blue t-shirt";

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    <div className="home">
      <div className="home-bg"></div>
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Join the <br />
                <span className="hero-highlight">Shoppable Video</span>
                <br />
                Revolution
              </h1>
              <p className="hero-description">
                Our AI-powered shoppable broadcasting solution adds a new
                dimension to any video stream and allows viewers to purchase
                items in real-time from their favorite shows - without leaving
                the screen.
              </p>
              <div className="hero__actions">
                <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                  Contact Us
                </a>
              </div>
            </div>
            {/*           <img src={HeroImg2} className="hero__image" /> */}
            <div className="hero-video-container">
              <video
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                poster={HeroImg2}
                preload={isMobile ? "metadata" : "auto"}
              >
                <source src={HeroVideoWebm} type="video/webm" />
                <source src={HeroVideoMp4} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        <section className="simple-section container">
          <h2>Yes. It's Really That Simple</h2>
          <div className="simple-content">
            <div className="simple-item">
              <div className="simple-icon">
                <VideoAnalyticsIcon size={64} color="#617afa" />
              </div>
              <p>
                Our advanced AI solution identifies products and tickets within
                real-time video streams, displaying them on viewers' devices for
                a seamless shopping experience.
              </p>
            </div>
            <div className="simple-item">
              <div className="simple-icon">
                <RevenueStreamIcon size={64} color="#617afa" />
              </div>
              <p>
                Each product sold based on your stream earns you a commission.
                Simply add an additional revenue stream - easy to integrate with
                Linear, FAST and Live channels.
              </p>
            </div>
            <div className="simple-item">
              <div className="simple-icon">
                <ViewerEngagementIcon size={64} color="#617afa" />
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
                      <img
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
                    <img
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
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-1.png"
                        alt="Frame 1"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-1.png"
                        alt="Product 1"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-2.png"
                        alt="Frame 2"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-2.png"
                        alt="Product 2"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-3.png"
                        alt="Frame 3"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-3.png"
                        alt="Product 3"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-4.png"
                        alt="Frame 4"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-4.png"
                        alt="Product 4"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-5.png"
                        alt="Frame 5"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-5.png"
                        alt="Product 5"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-6.png"
                        alt="Frame 6"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-6.png"
                        alt="Product 6"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-7.png"
                        alt="Frame 7"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-7.png"
                        alt="Product 7"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-8.png"
                        alt="Frame 8"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-8.png"
                        alt="Product 8"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-9.png"
                        alt="Frame 9"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-9.png"
                        alt="Product 9"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-10.png"
                        alt="Frame 10"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-10.png"
                        alt="Product 10"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-11.png"
                        alt="Frame 11"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-11.png"
                        alt="Product 11"
                      />
                    </div>
                  </div>

                  {/* Duplicate for seamless infinite scroll */}
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-1.png"
                        alt="Frame 1"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-1.png"
                        alt="Product 1"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-2.png"
                        alt="Frame 2"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-2.png"
                        alt="Product 2"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-3.png"
                        alt="Frame 3"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-3.png"
                        alt="Product 3"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-4.png"
                        alt="Frame 4"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-4.png"
                        alt="Product 4"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-5.png"
                        alt="Frame 5"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-5.png"
                        alt="Product 5"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-6.png"
                        alt="Frame 6"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-6.png"
                        alt="Product 6"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-7.png"
                        alt="Frame 7"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-7.png"
                        alt="Product 7"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-8.png"
                        alt="Frame 8"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-8.png"
                        alt="Product 8"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-9.png"
                        alt="Frame 9"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-9.png"
                        alt="Product 9"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-10.png"
                        alt="Frame 10"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-10.png"
                        alt="Product 10"
                      />
                    </div>
                  </div>
                  <div className="example-pair">
                    <div className="example-frame">
                      <img
                        src="/assets/frame-product-pairs/Frame-Image-11.png"
                        alt="Frame 11"
                      />
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-product">
                      <img
                        src="/assets/frame-product-pairs/product-11.png"
                        alt="Product 11"
                      />
                    </div>
                  </div>
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
                  <FastSetupIcon size={48} />
                </div>
                <h3>
                  Fast, easy set-up at no cost. We just require your feed.
                </h3>
              </div>
              <div className="feature-card feature-2">
                <div className="feature-icon">
                  <GamificationIcon size={48} />
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
                  <RewardsIcon size={48} />
                </div>
                <h3>Reward your viewers for interacting with your content.</h3>
              </div>
              <div className="feature-card feature-4">
                <div className="feature-icon">
                  <AnalyticsIcon size={48} />
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
              <div className="testimonial">
                <blockquote>
                  Edge Video's AI is revolutionizing Shoppable TV, letting you
                  buy what you see on-screen instantly. It's transforming ads
                  into instant shopping experiences, making them super effective
                  by connecting you with what you want, right when you want it.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Ralf Jacob</strong>
                  <span>
                    EVP Broadcast Operations & Technology for TelevisaUnivision
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video's new AI-powered interactive TV is changing the
                  game, turning passive watching into an engaging experience.
                  It's all about getting viewers involved, boosting their
                  happiness and loyalty. Edge Video is at the forefront, with AI
                  making TV way more interactive and fun.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Alex Duka</strong>
                  <span>
                    Advisor and Board Member, former Managing Director,
                    Citigroup
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge-AI is the most exciting product for video, since the
                  drone.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Joshua Elmore</strong>
                  <span>
                    Sr. Director Content Operations, The Weather Channel
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video blends web2 and web3 to transform shopping and
                  gaming with interactive streams, boosting engagement and
                  pioneering in digital entertainment. Their use of blockchain
                  enhances the user experience, setting new standards in the
                  online world.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Neil Wolfson</strong>
                  <span>
                    Active Board Member and Venture Investor, Former Partner at
                    KPMG and Former President of Wilmington Trust Investment
                    Management
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video's Web3 rewards are revolutionizing viewer loyalty
                  with a blend of blockchain and AI, making rewards secure,
                  transparent, and trustworthy. This fresh take is transforming
                  how viewers engage and trust in the digital era.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Richard Entrup</strong>
                  <span>
                    Managing Director, Enterprise Innovation @ KPMG US
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video's AI is flipping the script on streaming, turning
                  your screen time into shopping time. Now, watching TV also
                  means you can shop directly from your couch, opening up cool
                  new earning avenues for creators and brands. It's like making
                  your lazy TV time a shopping adventure!
                </blockquote>
                <div className="testimonial-author">
                  <strong>Jeffrey Hayzlett</strong>
                  <span>
                    Chairman, C-Suite Network Primetime Television & Podcast
                    Host, Former CMO, Kodak
                  </span>
                </div>
              </div>

              {/* Duplicate testimonials for seamless infinite scroll */}
              <div className="testimonial">
                <blockquote>
                  Edge Video's AI is revolutionizing Shoppable TV, letting you
                  buy what you see on-screen instantly. It's transforming ads
                  into instant shopping experiences, making them super effective
                  by connecting you with what you want, right when you want it.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Ralf Jacob</strong>
                  <span>
                    EVP Broadcast Operations & Technology for TelevisaUnivision
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video's new AI-powered interactive TV is changing the
                  game, turning passive watching into an engaging experience.
                  It's all about getting viewers involved, boosting their
                  happiness and loyalty. Edge Video is at the forefront, with AI
                  making TV way more interactive and fun.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Alex Duka</strong>
                  <span>
                    Advisor and Board Member, former Managing Director,
                    Citigroup
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge-AI is the most exciting product for video, since the
                  drone.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Joshua Elmore</strong>
                  <span>
                    Sr. Director Content Operations, The Weather Channel
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video blends web2 and web3 to transform shopping and
                  gaming with interactive streams, boosting engagement and
                  pioneering in digital entertainment. Their use of blockchain
                  enhances the user experience, setting new standards in the
                  online world.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Neil Wolfson</strong>
                  <span>
                    Active Board Member and Venture Investor, Former Partner at
                    KPMG and Former President of Wilmington Trust Investment
                    Management
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video's Web3 rewards are revolutionizing viewer loyalty
                  with a blend of blockchain and AI, making rewards secure,
                  transparent, and trustworthy. This fresh take is transforming
                  how viewers engage and trust in the digital era.
                </blockquote>
                <div className="testimonial-author">
                  <strong>Richard Entrup</strong>
                  <span>
                    Managing Director, Enterprise Innovation @ KPMG US
                  </span>
                </div>
              </div>
              <div className="testimonial">
                <blockquote>
                  Edge Video's AI is flipping the script on streaming, turning
                  your screen time into shopping time. Now, watching TV also
                  means you can shop directly from your couch, opening up cool
                  new earning avenues for creators and brands. It's like making
                  your lazy TV time a shopping adventure!
                </blockquote>
                <div className="testimonial-author">
                  <strong>Jeffrey Hayzlett</strong>
                  <span>
                    Chairman, C-Suite Network Primetime Television & Podcast
                    Host, Former CMO, Kodak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats container">
          <h2>Edge Video AI in Numbers.</h2>
          <div className="stats-grid">
            <AnimatedStat number={12} label="Channels" delay={0} />
            <AnimatedStat number={21527} label="Vendors" delay={200} />
            <AnimatedStat number={17415854} label="Products" delay={400} />
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
                <TelegramIcon size={24} color="white" />
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://twitter.com/edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterIcon size={24} color="white" />
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://www.linkedin.com/company/edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedInIcon size={24} color="white" />
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://www.youtube.com/@edgevideoai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <YouTubeIcon size={24} color="white" />
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://medium.com/edge-video-ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MediumIcon size={24} color="white" />
              </a>
            </li>
          </ul>
        </section>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
