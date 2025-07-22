import React from "react";
import "../styles/HomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ViewersPage() {

  return (
    <div className="home">
      <div className="home-bg"></div>
      <Navbar />

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
      <Footer />
    </div>
  );
}

