import React from "react";
import "../styles/HomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ChannelsPage() {

  return (
    <div className="home">
      <div className="home-bg"></div>
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">Monetize Your Content with Edge Video AI</h1>
              <p className="hero-description">
                Discover how our AI-powered technology enhances your broadcasting experiences,
                bringing the future of shoppable TV to your viewers.
              </p>
              <div className="hero__actions">
                <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="simple-section container">
          <h2>Why work with us?</h2>
          <div className="simple-content">
            <div className="simple-item">
              <p>71% of your viewers have a phone in their hand while watching your content.</p>
            </div>
            <div className="simple-item">
              <p>Adopting shoppable TV now makes your broadcast leading edge.</p>
            </div>
            <div className="simple-item">
              <p>Only Edge Video AI is able to monetize your broadcast in real-time.</p>
            </div>
            <div className="simple-item">
              <p>Really simple to integrate and scale—we just require a URL to your stream.</p>
            </div>
          </div>
        </section>
        <section className="simple-section container">
          <h2>Schedule your Demo now!</h2>
          <div className="hero__actions">
            <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
              Contact Us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

