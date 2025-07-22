import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";
import HeroImg2 from "/assets/hero-image-2.png";
import HeroVideoMp4 from "/assets/hero-video-min.mp4";
import HeroVideoWebm from "/assets/hero-video.webm";
import Logo from "/assets/logo.png";

export default function ViewersPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleNav = () => setNavOpen((v) => !v);
  const closeNav = () => {
    if (isMobile) setNavOpen(false);
  };

  useEffect(() => {
    if (isMobile && navOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [navOpen, isMobile]);

  return (
    <div className="home">
      <div className="home-bg"></div>
      <div className="top-banner">
        <span>Shoppable TV is NOW LIVE!</span>
        <a
          href="https://www.in.tv/shoppable-tv"
          target="_blank"
          rel="noopener noreferrer"
          className="banner-link"
        >
          Try It 👉
        </a>
      </div>

      <div className="floating-logo">
        <Link to="/home" className="logo-link">
          <img src={Logo} alt="Edge Video AI Logo" className="logo-image" />
          <div className="logo-text">
            <span className="logo-edge">Edge</span>
            <span className="logo-video">Video</span>
            <span className="logo-ai">AI</span>
          </div>
        </Link>
      </div>

      <nav className="floating-nav">
        <button
          className={`nav-orb ${navOpen ? "nav-orb--open" : ""}`}
          onClick={toggleNav}
          aria-label="Toggle Navigation"
        >
          <div className="orb-inner">
            <div className="orb-lines">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="orb-glow"></div>
        </button>

        <div className={`nav-items ${navOpen ? "nav-items--open" : ""}`}>
          <Link to="/for-channels" className="nav-item" data-tooltip="For Channels" onClick={closeNav}>
            <span className="nav-item-text">Channels</span>
          </Link>
          <Link to="/for-brands" className="nav-item" data-tooltip="For Brands" onClick={closeNav}>
            <span className="nav-item-text">Brands</span>
          </Link>
          <Link to="/for-viewers" className="nav-item" data-tooltip="For Viewers" onClick={closeNav}>
            <span className="nav-item-text">Viewers</span>
          </Link>
          <Link to="/app" className="nav-item nav-item--primary" data-tooltip="Open App" onClick={closeNav}>
            <span className="nav-item-text">Open App</span>
          </Link>
          <a href="mailto:info@edgevideo.ai" className="nav-item" data-tooltip="Contact Us" onClick={closeNav}>
            <span className="nav-item-text">Contact</span>
          </a>
        </div>

        <div className={`nav-overlay ${navOpen ? "nav-overlay--open" : ""}`} onClick={toggleNav}></div>
      </nav>

      <main className="home-main">
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">Shop What You Watch!</h1>
              <p className="hero-description">
                A new era of interactive TV is coming. Get ready to shop your favorite products while enjoying the content you love.
              </p>
              <div className="hero__actions">
                <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                  Contact Us
                </a>
              </div>
            </div>
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
          <h2>Why watch with us?</h2>
          <div className="simple-content">
            <div className="simple-item">
              <p>Discover products in real-time, inspired by your favorite shows and stars.</p>
            </div>
            <div className="simple-item">
              <p>Effortlessly buy what you see on screen, directly on your screen or mobile device.</p>
            </div>
            <div className="simple-item">
              <p>Stay tuned for rewards and exclusive deals via shoppable TV content.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

