// src/components/SafeComponent.jsx
import React from "react";

class SafeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console with context
    console.error("SafeComponent caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // If it's a DOM insertion error, try to recover after a short delay
    if (
      error.message.includes("insertBefore") ||
      error.message.includes("Node")
    ) {
      console.warn("DOM insertion error detected, attempting recovery...");
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div
          style={{
            padding: "10px",
            color: "#666",
            fontSize: "0.9rem",
            textAlign: "center",
          }}
        >
          {this.props.fallback || "Component temporarily unavailable"}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeComponent;
