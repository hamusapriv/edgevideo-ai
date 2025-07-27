import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import "../styles/redirectPage.css";

export default function InTravelRedirectPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [error, setError] = useState("");

  // Destination URLs for different regions
  const UK_CHANNEL = "https://qrfy.io/r/0bLd0JmUOR";
  const EU_CHANNEL = "https://qrfy.io/r/PDAf6Ou-H8";
  const US_CHANNEL = "https://qrfy.io/r/rv4H1_goV9";

  useEffect(() => {
    // Fetch user's location and determine redirect URL
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        let redirectUrl = US_CHANNEL; // Default to US
        let location = "United States";

        if (data.country_code === "GB") {
          // United Kingdom
          redirectUrl = UK_CHANNEL;
          location = "United Kingdom";
        } else if (data.in_eu) {
          // Any EU member state
          redirectUrl = EU_CHANNEL;
          location = "European Union";
        }

        setDestinationUrl(redirectUrl);
        setUserLocation(location);

        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsRedirecting(true);
              // Redirect after countdown
              window.location.href = redirectUrl;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      })
      .catch(() => {
        // Network / API error – default to US channel
        setDestinationUrl(US_CHANNEL);
        setUserLocation("United States (default)");
        setError("Could not detect location, defaulting to US channel");

        // Still start countdown for default redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsRedirecting(true);
              window.location.href = US_CHANNEL;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      });
  }, []);

  const handleManualRedirect = () => {
    if (destinationUrl) {
      setIsRedirecting(true);
      window.location.href = destinationUrl;
    }
  };

  if (isRedirecting) {
    return <LoadingOverlay message="Redirecting to your regional channel..." />;
  }

  return (
    <div className="redirect-page">
      <div className="redirect-container">
        <h1>Welcome to InTravel</h1>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <p>
          Detected location: <strong>{userLocation}</strong>
        </p>
        <p>Redirecting you to your regional channel in:</p>
        <div className="countdown">{countdown} seconds</div>

        {destinationUrl && (
          <>
            <button
              onClick={handleManualRedirect}
              className="manual-redirect-button"
            >
              Go to Channel Now
            </button>

            <div className="destination-url">Channel: {destinationUrl}</div>
          </>
        )}

        <button
          onClick={() => navigate("/")}
          className="manual-redirect-button"
          style={{ marginTop: "1rem", background: "#6c757d" }}
        >
          Back to EdgeVideo
        </button>
      </div>
    </div>
  );
}
