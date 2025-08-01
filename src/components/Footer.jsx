import React from "react";
import { Link } from "react-router-dom";
import Logo from "/assets/logo.png";
import "../styles/HomePage.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer-content">
          <div className="footer-logo">
            <Link to="/home" className="logo">
              <img
                src={Logo}
                alt="Edge Video AI Logo"
                style={{ height: "40px" }}
              />
              <div>
                <p
                  style={{
                    position: "relative",
                    margin: 0,
                    lineHeight: "1.2",
                    color: "#fff",
                  }}
                >
                  Edge
                  <br /> &nbsp; Video
                  <span
                    style={{
                      position: "absolute",
                      top: "3px",
                      right: "-10px",
                      fontSize: ".8rem",
                      fontWeight: "400",
                      opacity: "0.5",
                    }}
                  >
                    AI
                  </span>
                </p>
              </div>
            </Link>
          </div>
          <div className="footer-links">
            <a href="mailto:developers@edgevideo.ai">Reach Out</a>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookies Settings</Link>
          </div>
        </div>
        <p className="footer-copyright" style={{ color: "#fff" }}>
          Copyright © 2025 Edge Video B.V.
        </p>
      </div>
    </footer>
  );
}
