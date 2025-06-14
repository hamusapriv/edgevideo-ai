// src/pages/TermsPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/TermsPage.css";

export default function TermsPage() {
  return (
    <div className="terms-page">
      <main className="terms-page__main">
        <section className="terms-page__hero">
          <div className="terms-page__container">
            <Link to="/" className="terms-page__back-btn">
              ← Back
            </Link>
            <h1 className="terms-page__title">Terms of Service</h1>

            <div className="terms-page__policy">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Edge Video, a leader in Web3 streaming services. Our
                terms govern your use of our AI-powered interaction, gaming, and
                shopping platform, integrated with FAST channels.
              </p>

              <h2>2. Platform Use</h2>
              <ul>
                <li>
                  <strong>Web3 Interaction:</strong> Engage with our services in
                  compliance with Web3 standards, respecting community
                  guidelines and the decentralized nature of our offerings.
                </li>
                <li>
                  <strong>Content &amp; IP:</strong> Enjoy content and
                  participate in gaming and shopping experiences while
                  respecting the intellectual property rights embedded within
                  the blockchain.
                </li>
                <li>
                  <strong>Token Transactions:</strong> Interact with $FAST
                  tokens per our guidelines, supporting fair and equitable use
                  within our ecosystem.
                </li>
              </ul>

              <h2>3. Disclaimers &amp; Limitations</h2>
              <p>
                Our Web3 platform is provided “as is,” with continuous
                development to enhance features and user experience. Edge Video
                disclaims all liability related to the evolving nature of Web3
                technologies and the experimental stage of blockchain
                integrations.
              </p>

              <h2>4. Jurisdiction &amp; Governance</h2>
              <p>
                These terms are governed by the principles of decentralization
                and community governance inherent to Web3, with a commitment to
                transparency and user empowerment.
              </p>

              <h2>5. Amendments &amp; Community Feedback</h2>
              <p>
                We embrace the dynamic nature of Web3, inviting our community to
                contribute to the evolution of these terms through open dialogue
                and feedback.
              </p>

              <h2>6. Contact &amp; Support</h2>
              <p>
                For inquiries or partnership proposals, reach out at{" "}
                <a href="mailto:info@edgevideo.ai">info@edgevideo.ai</a>. Stay
                updated on developments via our main page and social channels.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
