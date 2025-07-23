import React from "react";
import "../styles/HomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JoinUsSection from "../components/JoinUsSection";
import ViewersSvg1 from "../components/svgs/ViewersSvg1";
import ViewersSvg2 from "../components/svgs/ViewersSvg2";
import ViewersSvg3 from "../components/svgs/ViewersSvg3";

export default function ViewersPage() {
  return (
    <div className="home">
      <div className="home-bg"></div>
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="sub-hero-container">
            <div className="sub-hero-content">
              <h1 className="hero-title sub-hero-title">
                Shop What You Watch!
              </h1>
              <p className="hero-description">
                A new era of interactive TV is coming. Get ready to shop your
                favorite products while enjoying the content you love.
              </p>
            </div>
          </div>
        </section>

        <section className="simple-section container">
          <h2>What’s in It for You?</h2>
          <div className="simple-content">
            <div className="simple-item">
              <div style={{ height: "160px" }}>
                <ViewersSvg1 />
              </div>
              <p>
                Discover products in real-time, inspired by your favorite shows
                and stars.
              </p>
            </div>
            <div className="simple-item">
              <div style={{ height: "160px" }}>
                <ViewersSvg2 />
              </div>
              <p>
                Effortlessly buy what you see on screen, directly on your screen
                or mobile device.
              </p>
            </div>
            <div className="simple-item">
              <div style={{ height: "160px" }}>
                <ViewersSvg3 />
              </div>
              <p>
                Stay tuned for rewards and exclusive deals via shoppable TV
                content.
              </p>
            </div>
          </div>
        </section>
        <section className="simple-section container">
          <h2>Here’s what other viewers are saying about Shoppable TV</h2>
          <div className="simple-content">
            <div className="simple-item">
              <p>“Wow this is really smooth, and super intuitive.”</p>
              <quote>— Maria, Spain</quote>
            </div>
            <div className="simple-item">
              <p>
                “Pretty cool that I can buy exactly what I am seeing on screen.”
              </p>
              <quote>— Andy, Germany</quote>
            </div>
            <div className="simple-item">
              <p>
                “I love the idea of getting rewarded for interacting with shows
                and content.”
              </p>
              <quote>— Filip, Switzerland</quote>
            </div>
          </div>
        </section>
      </main>
      <h2 style={{ textAlign: "center", margin: "1rem auto" }}>
        Life is better with friends.
      </h2>
      <JoinUsSection />
      <Footer />
    </div>
  );
}
