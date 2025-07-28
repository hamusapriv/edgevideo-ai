// src/components/ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error("React Error Boundary caught an error:", error, errorInfo);

    // Only log DOM-related errors in development
    if (process.env.NODE_ENV === "development") {
      if (
        error.message?.includes("removeChild") ||
        error.message?.includes("appendChild")
      ) {
        console.warn(
          "DOM manipulation error detected. This might be caused by direct DOM manipulation conflicting with React."
        );
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            margin: "1rem",
          }}
        >
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "0.5rem 1rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
