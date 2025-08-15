import React from "react";
import ThreePlates from "./examples/ThreePlates.jsx";
import SvgFramerBox from "./examples/SvgFramerBox.jsx";
import CssBox from "./examples/CssBox.jsx";
import CanvasBurstBox from "./examples/CanvasBurstBox.jsx";
import LottieBox from "./examples/LottieBox.jsx";
import ThreeBox from "./examples/ThreeBox.jsx";

export default function SandboxApp() {
  return (
    <>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="canvas-background">
          <ThreePlates />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">EdgeVideo AI</h1>
          <h2 className="hero-subtitle">Next-Generation Video Experience</h2>
          <p className="hero-description">
            Explore our interactive video frame catalogue powered by
            cutting-edge 3D technology. Experience the future of video content
            with immersive, wheel-based navigation.
          </p>
          <div className="hero-cta">
            <a href="#explore" className="cta-button cta-primary">
              Explore Frames
            </a>
            <a href="#learn" className="cta-button cta-secondary">
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Animation Examples Section */}
      <div className="animation-showcase">
        <div className="showcase-container">
          <h2 className="showcase-title">Animation Technologies</h2>
          <p className="showcase-description">
            Explore different animation techniques and their implementations
          </p>

          <div className="animation-grid">
            <div className="animation-card">
              <h3>SVG + Framer Motion</h3>
              <div className="animation-box">
                <SvgFramerBox />
              </div>
              <p>Declarative animations with smooth transitions</p>
            </div>

            <div className="animation-card">
              <h3>CSS Keyframes</h3>
              <div className="animation-box">
                <CssBox />
              </div>
              <p>Pure CSS animations with hardware acceleration</p>
            </div>

            <div className="animation-card">
              <h3>Canvas 2D</h3>
              <div className="animation-box">
                <CanvasBurstBox />
              </div>
              <p>Custom particle systems and 2D graphics</p>
            </div>

            <div className="animation-card">
              <h3>Lottie Animation</h3>
              <div className="animation-box">
                <LottieBox />
              </div>
              <p>Vector animations with inline JSON data</p>
            </div>

            <div className="animation-card">
              <h3>Three.js 3D</h3>
              <div className="animation-box">
                <ThreeBox />
              </div>
              <p>WebGL-powered 3D graphics and interactions</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
