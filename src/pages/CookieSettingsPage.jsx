// src/pages/CookieSettingsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { applyGAConsent } from "../utils/analytics";
import "../styles/cookieSettings.css";

export default function CookieSettingsPage() {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (consent) {
      setPreferences(JSON.parse(consent));
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    let timeoutId;
    if (showSuccessMessage) {
      timeoutId = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showSuccessMessage]);

  const applyConsent = (prefs) => {
    // Google Analytics
    applyGAConsent(prefs.analytics);
  };

  const savePreferences = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    applyConsent(preferences);

    // Show success message using React state
    setShowSuccessMessage(true);
  };

  const resetToDefaults = () => {
    const defaults = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(defaults);
  };

  return (
    <div className="cookie-settings-page">
      {/* Success message */}
      {showSuccessMessage && (
        <div key="success-message" className="success-message">
          Cookie preferences saved successfully!
        </div>
      )}

      <main className="cookie-settings-main">
        <div className="container">
          <Link to="/app" className="back-btn">
            ← Back to App
          </Link>

          <div className="header-section">
            <h1>🍪 Cookie Settings</h1>
            <p className="subtitle">
              Manage your cookie preferences and understand how we use cookies
              to enhance your experience.
            </p>
          </div>

          <div className="cookie-info-section">
            <h2>What are cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device when
              you visit our website. They help us provide you with a better
              experience by remembering your preferences and analyzing how you
              use our site.
            </p>
          </div>

          <div className="cookie-categories-section">
            <h2>Cookie Categories</h2>

            <div className="category-card">
              <div className="category-header">
                <div className="category-info">
                  <h3>Necessary Cookies</h3>
                  <span className="required-badge">Required</span>
                </div>
                <label className="cookie-switch">
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled={true}
                  />
                  <span className="switch-slider necessary"></span>
                </label>
              </div>
              <p>
                These cookies are essential for the website to function
                properly. They enable core functionality such as security,
                network management, and accessibility. These cookies cannot be
                disabled.
              </p>
              <div className="examples">
                <strong>Examples:</strong> Session management, security tokens,
                accessibility features
              </div>
            </div>

            <div className="category-card">
              <div className="category-header">
                <div className="category-info">
                  <h3>Analytics Cookies</h3>
                  <span className="optional-badge">Optional</span>
                </div>
                <label className="cookie-switch">
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
                  <span className="switch-slider"></span>
                </label>
              </div>
              <p>
                These cookies help us understand how visitors interact with our
                website by collecting and reporting information anonymously.
                This helps us improve our website and services.
              </p>
              <div className="examples">
                <strong>Examples:</strong> Google Analytics, page views, user
                behavior analysis
              </div>
            </div>

            <div className="category-card">
              <div className="category-header">
                <div className="category-info">
                  <h3>Marketing Cookies</h3>
                  <span className="optional-badge">Optional</span>
                </div>
                <label className="cookie-switch">
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
                  <span className="switch-slider"></span>
                </label>
              </div>
              <p>
                These cookies are used to deliver personalized advertisements
                and measure the effectiveness of advertising campaigns. They may
                be set by us or third-party providers.
              </p>
              <div className="examples">
                <strong>Examples:</strong> Ad targeting, conversion tracking,
                remarketing
              </div>
            </div>

            <div className="category-card">
              <div className="category-header">
                <div className="category-info">
                  <h3>Functional Cookies</h3>
                  <span className="optional-badge">Optional</span>
                </div>
                <label className="cookie-switch">
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
                  <span className="switch-slider"></span>
                </label>
              </div>
              <p>
                These cookies enable enhanced functionality and personalization
                features, such as remembering your preferences and settings.
              </p>
              <div className="examples">
                <strong>Examples:</strong> Language preferences, theme settings,
                user interface customization
              </div>
            </div>
          </div>

          <div className="actions-section">
            <button onClick={resetToDefaults} className="btn-secondary">
              Reset to Defaults
            </button>
            <button onClick={savePreferences} className="btn-primary">
              Save Preferences
            </button>
          </div>

          <div className="additional-info">
            <h2>Need More Information?</h2>
            <p>
              For more details about how we collect, use, and protect your data,
              please read our <Link to="/privacy">Privacy Policy</Link> and{" "}
              <Link to="/terms">Terms of Service</Link>.
            </p>

            <div className="contact-info">
              <p>
                If you have any questions about our cookie practices, please
                contact us at{" "}
                <a href="mailto:support@edgevideo.ai">support@edgevideo.ai</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
