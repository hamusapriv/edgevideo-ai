import React from "react";
import { Link } from "react-router-dom";
import EdgeLogo from "../assets/edgevideoai-logo.png";
import "../styles/HomePage.css";

export default function HomePage() {
  return (
    <div className="home-container">
      <header className="site-header">
        <Link to="/home" className="logo-link">
          <img src={EdgeLogo} alt="Edge Video" height="40" />
        </Link>
        <nav className="site-nav">
          <Link to="/app" className="nav-link">
            Launch App
          </Link>
        </nav>
      </header>

      <section className="hero">
        <h1>Join The Shoppable Video Revolution</h1>
        <p>
          Our AI-powered shoppable broadcasting solution adds a new dimension to
          any video stream and allows viewers to purchase items in real-time from
          their favorite shows—without leaving the screen.
        </p>
        <a href="mailto:info@edgevideo.ai" className="cta-button">
          Contact Us
        </a>
        <img
          className="hero-img"
          src="https://cdn.prod.website-files.com/65dc7230257517ba67df2f52/67e716ffa7eb0dcfa13904aa_1_hero-smaller.png"
          alt="Edge Video Demo"
        />
      </section>

      <section className="features">
        <div className="feature-item">
          <h2>Edge Video AI in Action</h2>
          <p>
            Transform any stream into an interactive shopping experience. Engage
            your audience and convert views into sales with built-in games and
            real-time purchases.
          </p>
        </div>
      </section>
    </div>
  );
}
