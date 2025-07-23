import React from "react";
import "../styles/HomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JoinUsSection from "../components/JoinUsSection";
import ChannelsSvg1 from "../components/svgs/ChannelsSvg1";
import ChannelsSvg2 from "../components/svgs/ChannelsSvg2";
import ChannelsSvg3 from "../components/svgs/ChannelsSvg3";
import ChannelsSvg4 from "../components/svgs/ChannelsSvg4";

export default function ChannelsPage() {
  return (
    <div className="home">
      <div className="home-bg"></div>
      <Navbar />

      <main className="home-main">
        <section className="hero">
          <div className="sub-hero-container">
            <div className="sub-hero-content">
              <h1 className="hero-title sub-hero-title">
                <span>Monetize Your Content with </span>{" "}
                <span>Edge Video AI</span>
              </h1>
              <p className="hero-description">
                Discover how our AI-powered technology enhances your
                broadcasting experiences, bringing the future of shoppable TV to
                your viewers.
              </p>
              <div className="hero__actions">
                <a href="mailto:info@edgevideo.ai" className="btn btn--primary">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="channels-benefits-section container">
          <h2 className="channels-benefits-title">Why work with us?</h2>
          <div className="channels-benefits-grid">
            <div className="channels-benefit-card">
              <div className="channels-benefit-icon">
                <ChannelsSvg1 width={64} height={64} />
              </div>
              <div className="channels-benefit-content">
                <h3>Mobile-First Audience</h3>
                <p>
                  71% of your viewers have a phone in their hand while watching
                  your content.
                </p>
              </div>
            </div>
            <div className="channels-benefit-card">
              <div className="channels-benefit-icon">
                <ChannelsSvg2 width={64} height={64} />
              </div>
              <div className="channels-benefit-content">
                <h3>Broadcast Innovation</h3>
                <p>
                  Adopting shoppable TV now makes your broadcast leading edge.
                </p>
              </div>
            </div>
            <div className="channels-benefit-card">
              <div className="channels-benefit-icon">
                <ChannelsSvg3 width={64} height={64} />
              </div>
              <div className="channels-benefit-content">
                <h3>Monetize in Real-Time</h3>
                <p>
                  Only Edge Video AI is able to monetize your broadcast in
                  real-time.
                </p>
              </div>
            </div>
            <div className="channels-benefit-card">
              <div className="channels-benefit-icon">
                <ChannelsSvg4 width={64} height={64} />
              </div>
              <div className="channels-benefit-content">
                <h3>Effortless Integration</h3>
                <p>
                  Really simple to integrate and scale—we just require a URL to
                  your stream.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="channels-testimonials-section">
          <h2 className="channels-testimonials-title">
            Here’s what industry players say...
          </h2>
          <div className="channels-testimonials-grid">
            <div className="channels-testimonial">
              <blockquote>
                “The AI automation of the shoppable TV platform is a true game
                changer for us. It seamlessly identifies shoppable moments
                during our broadcasts, creating new revenue streams without any
                extra effort from our team. Viewers can instantly engage and
                purchase through a simple QR code or directly via our web store.
                It’s revolutionized how we monetize our content.”
              </blockquote>
              <div className="channels-testimonial-author">
                <strong>Rian Bester,</strong>
                <br />
                former CEO of InTravel
              </div>
            </div>
            <div className="channels-testimonial">
              <blockquote>
                "At INTRAVEL, we are dedicated to bringing audiences closer to
                the world through immersive storytelling. Shoppable TV takes
                this a step further—allowing viewers to instantly act on their
                inspiration, whether that means purchasing a product or booking
                their next adventure."
              </blockquote>
              <div className="channels-testimonial-author">
                <strong>Viktoriia Tkachenko,</strong>
                <br />
                CEO of INSIGHT TV
              </div>
            </div>
            <div className="channels-testimonial">
              <blockquote>
                "Shoppable TV represents the next evolution of home shopping.
                This technology bridges the gap between content and commerce,
                making it easier than ever for consumers to discover and
                purchase products in a truly interactive way."
              </blockquote>
              <div className="channels-testimonial-author">
                <strong>Kieran Knight,</strong>
                <br />
                Senior Manager | QVC+ Streaming Service & Broadcast Distribution
              </div>
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
      <JoinUsSection />
      <Footer />
    </div>
  );
}
