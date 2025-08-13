import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "/assets/logo.png";
import "../styles/HomePage.css";
import MarketingThemeToggle from "./MarketingThemeToggle";
import FloatingProfile from "./FloatingProfile";

export default function Navbar() {
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
    <>
      <div className="top-banner">
        {" "}
        <a
          href="https://www.in.tv/shoppable-tv"
          target="_blank"
          rel="noopener noreferrer"
          className="banner-link"
          style={{
            textDecoration: "none",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <p style={{ whiteSpace: "nowrap", color: "white" }}>
            Shoppable TV is NOW LIVE!
          </p>
          <p
            style={{
              fontWeight: "bold",
              padding: "10px",
              background: "var(--color-primary)",
              borderRadius: "4px",
              color: "#fff",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            Try It
          </p>
        </a>
      </div>
      <div className="floating-container">
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
            <Link
              to="/channels"
              className="nav-item"
              data-tooltip="For Channels"
              onClick={closeNav}
            >
              <span className="nav-item-text">Channels</span>
            </Link>
            <Link
              to="/brands"
              className="nav-item"
              data-tooltip="For Brands"
              onClick={closeNav}
            >
              <span className="nav-item-text">Brands</span>
            </Link>
            <Link
              to="/viewers"
              className="nav-item"
              data-tooltip="For Viewers"
              onClick={closeNav}
            >
              <span className="nav-item-text">Viewers</span>
            </Link>
            <Link
              to="/app"
              className="nav-item nav-item--primary"
              data-tooltip="Open App"
              onClick={closeNav}
            >
              <span className="nav-item-text">Open App</span>
            </Link>
            <a
              href="mailto:info@edgevideo.ai"
              className="nav-item"
              data-tooltip="Contact Us"
              onClick={closeNav}
            >
              <span className="nav-item-text">Contact</span>
            </a>
            <div className="nav-item nav-theme-toggle">
              <MarketingThemeToggle />
            </div>
          </div>

          <div
            className={`nav-overlay ${navOpen ? "nav-overlay--open" : ""}`}
            onClick={toggleNav}
          ></div>
        </nav>
        <FloatingProfile />
      </div>
    </>
  );
}
