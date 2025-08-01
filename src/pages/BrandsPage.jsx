import React from "react";
import "../styles/HomePage.css";
import "../styles/marketing-theme.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JoinUsSection from "../components/JoinUsSection";
import BrandSlider from "../components/BrandSlider";
import BrandsSvg1 from "../components/svgs/BrandsSvg1";
import BrandsSvg2 from "../components/svgs/BrandsSvg2";
import BrandsSvg3 from "../components/svgs/BrandsSvg3";
import MarketingBG from "../components/MarketingBG";

export default function BrandsPage() {
  return (
    <div className="home marketing-page">
      <MarketingBG />
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="sub-hero-container">
            <div className="sub-hero-content">
              <h1 className="hero-title sub-hero-title">
                <span>Shoppable TV</span>{" "}
                <span>is the future of e-commerce</span>
              </h1>
              <p className="hero-description">
                Increase conversion by matching your products with relevant
                content, all powered by our cutting-edge AI technology.
              </p>
              <div className="hero__actions">
                <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="">
          <h2 className="partners-title">
            <span className="hero-highlight">Your competitors</span> <br /> are
            already on TV — are you?{" "}
          </h2>
          <BrandSlider />
          <h4 style={{ textAlign: "center" }}>
            Contact us to make your product also instantly shoppable!
          </h4>
        </section>

        <section className="get-listed-section">
          <h2 className="get-listed-title">Want to get listed?</h2>
          <p className="get-listed-desc">
            Get your brand listed in our database to enable real-time product
            recognition and seamless shopping directly from TV screens and
            mobile devices.
          </p>
          <p className="get-listed-desc">
            Contact us today to get your products seamlessly recognized and
            instantly shoppable through AI-driven video technology!
          </p>
          <div className="get-listed-action">
            <a href="mailto:info@edgevideo.ai" className="get-listed-btn">
              Contact Us
            </a>
          </div>
        </section>

        <section className="simple-section container">
          <h2>Why work with us?</h2>
          <div className="grid-3">
            <div className="simple-item">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "180px",
                }}
              >
                {" "}
                <BrandsSvg1 width={64} height={64} />
              </div>
              <p>
                Television commerce is the future - Edge Video AI makes it
                possible for you - in real-time.
              </p>
            </div>
            <div className="simple-item">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "180px",
                }}
              >
                {" "}
                <BrandsSvg2 width={64} height={64} />
              </div>
              <p>
                Integration couldn’t be simpler- all you need to do is give us
                access via an affiliate program.
              </p>
            </div>
            <div className="simple-item">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "180px",
                }}
              >
                {" "}
                <BrandsSvg3 width={64} height={64} />
              </div>
              <p>
                Reach new audiences through TV - we match you only with highly
                relevant content.
              </p>
            </div>
          </div>
        </section>
      </main>
      <JoinUsSection />
      <Footer />
    </div>
  );
}
