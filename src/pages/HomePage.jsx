import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";
import HeroImg from "/assets/hero-image.png";
import HeroImg2 from "/assets/hero-image-2.png";
import HeroVideoMp4 from "/assets/hero-video.mp4";
import HeroVideoWebm from "/assets/hero-video.webm";
import Logo from "/assets/logo.png"; // Assuming you have a logo image

export default function HomePage() {
  const [navOpen, setNavOpen] = useState(false);

  const toggleNav = () => setNavOpen((v) => !v);

  return (
    <div className="home">
      <div className="home-bg"></div>
      <header className="home-header">
        <div className="home-header__inner">
          <Link
            to="/home"
            className="logo"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {" "}
            <img
              src={Logo}
              alt="Edge Video AI Logo"
              style={{ height: "40px" }}
            />{" "}
            <div style={{}}>
              <p style={{ position: "relative", margin: 0, lineHeight: "1.2" }}>
                Edge
                <br /> &nbsp;Video
                <span
                  style={{
                    position: "absolute",
                    top: "3px",
                    right: "-15px",
                    fontSize: "1rem",
                    fontWeight: "400",
                    opacity: "0.8",
                  }}
                >
                  AI
                </span>
              </p>
            </div>
          </Link>
          <button className="nav-toggle" onClick={toggleNav}>
            ☰
          </button>
          <nav className={`nav ${navOpen ? "nav--open" : ""}`}>
            <ul className="home-nav__list">
              <li>
                <Link to="/for-channels">For Channels</Link>
              </li>
              <li>
                <Link to="/for-brands">For Brands</Link>
              </li>
              <li>
                <Link to="/for-viewers">For Viewers</Link>
              </li>
              <li>
                <Link to="/app">Open App</Link>
              </li>
              <li>
                <a href="mailto:info@edgevideo.ai">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="home-main">
        <section className="hero">
          <div className="hero-container">
            <div
              style={{
                flex: 1,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignContent: "center",
                gap: "20px",
              }}
            >
              <h1 style={{ fontSize: "3rem", lineHeight: "1.2" }}>
                Join the <br />
                <span style={{ color: "#524fd9", whiteSpace: "nowrap" }}>
                  Shoppable Video
                </span>{" "}
                <br />
                Revolution
              </h1>
              <div className="hero__actions">
                <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                  Contact Us
                </a>
              </div>
              <p style={{ fontSize: "1.5rem", lineHeight: "1.5" }}>
                Our AI-powered shoppable broadcasting solution adds a new
                dimension to any video stream and allows viewers to purchase
                items in real-time from their favorite shows - without leaving
                the screen.{" "}
              </p>
            </div>
            {/*           <img src={HeroImg2} className="hero__image" /> */}
            <div className="hero-video-container">
              <video className="hero-video" autoPlay muted loop playsInline>
                <source src={HeroVideoWebm} type="video/webm" />
                <source src={HeroVideoMp4} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        <section className="features container">
          <h2>What Edge Video AI Delivers</h2>
          <div className="features__grid">
            <div className="feature-card">
              <h3>No Cost Setup</h3>
              <p>Provide your feed and start streaming with shopping.</p>
            </div>
            <div className="feature-card">
              <h3>Gamification</h3>
              <p>Engage viewers and keep them coming back.</p>
            </div>
            <div className="feature-card">
              <h3>Viewer Rewards</h3>
              <p>Reward interactions with Web3 tokens.</p>
            </div>
            <div className="feature-card">
              <h3>Insightful Data</h3>
              <p>Learn about your audience and boost ad spend.</p>
            </div>
          </div>
        </section>

        <section className="social container">
          <h2>Follow Us</h2>
          <ul className="social__list">
            <li className="social__item">
              <span className="image-placeholder social__icon" />
            </li>
            <li className="social__item">
              <span className="image-placeholder social__icon" />
            </li>
            <li className="social__item">
              <span className="image-placeholder social__icon" />
            </li>
          </ul>
        </section>
      </main>
      <footer className="footer">
        <div className="footer__inner container">
          <p>© 2025 Edge Video B.V.</p>
        </div>
      </footer>
    </div>
  );
}
