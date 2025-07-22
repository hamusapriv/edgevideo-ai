import React from "react";
import "../styles/HomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function BrandsPage() {

  return (
    <div className="home">
      <div className="home-bg"></div>
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">Shoppable TV is the future of e-commerce</h1>
              <p className="hero-description">
                Increase conversion by matching your products with relevant content, all powered by our cutting-edge AI technology.
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
              <p>Television commerce is the future - Edge Video AI makes it possible for you - in real-time.</p>
            </div>
            <div className="simple-item">
              <p>Integration couldn’t be simpler- all you need to do is give us access via an affiliate program.</p>
            </div>
            <div className="simple-item">
              <p>Reach new audiences through TV - we match you only with highly relevant content.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

