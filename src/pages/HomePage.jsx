import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";
import HeroImg from "/assets/hero-image.png";
import HeroImg2 from "/assets/hero-image-2.png";
import HeroVideoMp4 from "/assets/hero-video.mp4";
import HeroVideoWebm from "/assets/hero-video.webm";

export default function HomePage() {
  const [navOpen, setNavOpen] = useState(false);

  const toggleNav = () => setNavOpen((v) => !v);

  return (
    <div className="home">
      <div className="home-bg"></div>
      <header className="header">
        <div className="header__inner container">
          <Link to="/home" className="logo">
            EdgeVideo
          </Link>
          <button className="nav-toggle" onClick={toggleNav}>
            ☰
          </button>
          <nav className={`nav ${navOpen ? "nav--open" : ""}`}>
            <ul className="nav__list">
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

      <main className="main">
        <section className="hero">
          <div className="container">
            <p className="hero__subtitle">Shoppable TV is NOW LIVE!</p>
            <h1 className="hero__title">Join the Shoppable Video Revolution</h1>
            <p className="hero__lead">
              EdgeVideo adds real-time shopping to any video stream.
            </p>
            <div className="hero__actions">
              <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                Contact Us
              </a>
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
