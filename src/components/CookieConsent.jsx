// src/components/CookieConsent.jsx
import React, { useState, useEffect } from "react";
import { applyConsent } from "../utils/cookieManager";
import "../styles/cookieConsent.css";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      applyConsent(savedPreferences);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    applyConsent(allAccepted);
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem("cookie-consent", JSON.stringify(necessaryOnly));
    applyConsent(necessaryOnly);
    setIsVisible(false);
  };

  const saveCustom = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    applyConsent(preferences);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <div className="cookie-header">
          <h3>🍪 Cookie Preferences</h3>
          <p>
            We use cookies to enhance your experience, analyze site traffic, and
            personalize content. Choose your preferences below.
          </p>
        </div>

        <div className="cookie-categories">
          <div className="cookie-category">
            <label className="cookie-toggle">
              <input
                type="checkbox"
                checked={preferences.necessary}
                disabled={true}
              />
              <span className="toggle-slider necessary"></span>
              <div className="category-info">
                <strong>Necessary Cookies</strong>
                <p>Essential for website functionality. Cannot be disabled.</p>
              </div>
            </label>
          </div>

          <div className="cookie-category">
            <label className="cookie-toggle">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    analytics: e.target.checked,
                  }))
                }
              />
              <span className="toggle-slider"></span>
              <div className="category-info">
                <strong>Analytics Cookies</strong>
                <p>
                  Help us understand how visitors interact with our website.
                </p>
              </div>
            </label>
          </div>

          <div className="cookie-category">
            <label className="cookie-toggle">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    marketing: e.target.checked,
                  }))
                }
              />
              <span className="toggle-slider"></span>
              <div className="category-info">
                <strong>Marketing Cookies</strong>
                <p>Used to deliver personalized advertisements.</p>
              </div>
            </label>
          </div>

          <div className="cookie-category">
            <label className="cookie-toggle">
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    functional: e.target.checked,
                  }))
                }
              />
              <span className="toggle-slider"></span>
              <div className="category-info">
                <strong>Functional Cookies</strong>
                <p>Enable enhanced functionality and personalization.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="cookie-actions">
          <button onClick={acceptNecessary} className="btn-secondary">
            Accept Necessary Only
          </button>
          <button onClick={saveCustom} className="btn-primary">
            Save Preferences
          </button>
          <button onClick={acceptAll} className="btn-primary">
            Accept All
          </button>
        </div>

        <div className="cookie-links">
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
