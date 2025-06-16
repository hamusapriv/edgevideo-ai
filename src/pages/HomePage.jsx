import React from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

export default function HomePage() {
  return (
    <div className="home-container">
      <header className="site-header">
        <Link to="/home" className="logo-link">
          EdgeVideo
        </Link>
        <nav className="site-nav">
          <Link to="/for-channels" className="nav-link">
            For Channels
          </Link>
          <Link to="/for-brands" className="nav-link">
            For Brands
          </Link>
          <Link to="/for-viewers" className="nav-link">
            For Viewers
          </Link>
          <Link to="/app" className="nav-link">
            Open App
          </Link>
          <a href="mailto:info@edgevideo.ai" className="nav-link">
            Contact Us
          </a>
        </nav>
      </header>

      <section className="hero">
        <p className="tagline">Shoppable TV is NOW LIVE!</p>
        <h1>Join the Shoppable Video Revolution</h1>
        <p>
          Our AI-powered shoppable broadcasting solution adds a new dimension to
          any video stream and allows viewers to purchase items in real-time from
          their favorite shows—without leaving the screen.
        </p>
        <a href="mailto:info@edgevideo.ai" className="cta-button">
          Contact Us
        </a>
        <div className="image-placeholder hero-img" />
      </section>

      <section className="how-it-works">
        <h2>It&apos;s Really That Simple</h2>
        <ol>
          <li>Watch Any Video Stream</li>
          <li>Scan QR Code</li>
          <li>Product Matched</li>
          <li>Shop and Enjoy</li>
        </ol>
      </section>

      <section className="benefits">
        <h2>AI-Driven Shopping</h2>
        <p>
          Edge&apos;s AI delivers personalised shopping recommendations based on
          view activity, building outsized revenues for your streaming operations.
        </p>
        <h2>Be the Gateway to Web3</h2>
        <p>
          Introduce your viewers to the joy of Web3 reward systems. Help them take
          the next step with the $FAST token.
        </p>
        <h2>Touch Every Edge</h2>
        <p>
          Join our growing community of 167,201 users across Kick, Twitch, Dingo,
          and TV channels.
        </p>
      </section>

      <section className="features-list">
        <h2>What Edge Video AI delivers.</h2>
        <ul>
          <li>Fast, easy set-up at no cost. We just require your feed.</li>
          <li>Gamification adds additional “stickiness” to your content.</li>
          <li>Reward your viewers for interacting with your content.</li>
          <li>We provide data insights of your viewers to help your ad spend.</li>
        </ul>
      </section>

      <section className="cta">
        <h2>Transform Your Stream Now</h2>
        <p>Engage, Interact, and Shop with EdgeVideo</p>
        <a href="mailto:info@edgevideo.ai" className="cta-button">
          Contact Us
        </a>
      </section>

      <section className="newsletter">
        <h2>Stay Updated with Edge Video News</h2>
        <p>Subscribe to our newsletter for the latest updates, news, and features.</p>
        <form>
          <input type="email" placeholder="Email address" />
          <button type="submit">Sign Up</button>
        </form>
      </section>

      <footer className="footer">
        <p>© 2025 Edge Video B.V.</p>
      </footer>
    </div>
  );
}
