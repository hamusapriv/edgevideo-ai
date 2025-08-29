// src/pages/DocsPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/docsPage.css";
import edgeVideoLogo from "../assets/edgevideoai-logo.png";

export default function DocsPage() {
  const [copiedStates, setCopiedStates] = useState({});

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const CopyIcon = () => (
    <svg
      className="copy-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      className="copy-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points="20,6 9,17 4,12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
  return (
    <div className="docs-page">
      <div className="docs-container">
        <Link to="/" className="back-btn">
          ← Back to Home
        </Link>

        <div className="header-section">
          <img
            src={edgeVideoLogo}
            alt="EdgeVideo AI Logo"
            className="docs-logo"
          />
          <h1>Developer Documentation</h1>
          <p className="subtitle">
            WebSocket and API Integration Guide for EdgeVideo Platform
          </p>
        </div>

        <div className="docs-content">
          <div className="intro-section">
            <p>
              This documentation provides guidance for third-party developers to
              integrate with the EdgeVideo platform's WebSocket service for
              real-time product updates related to video streams and the REST
              API endpoint for fetching recent products from a channel. The
              integration allows you to receive live product notifications
              (e.g., products detected or recommended in a video stream) and
              retrieve historical/recent products.
            </p>
            <div className="note-box">
              <strong>Note:</strong> All interactions require a valid{" "}
              <code>channelId</code>, which identifies the specific video stream
              or channel. This is typically provided by the EdgeVideo platform
              when embedding or accessing a stream. Authentication is not
              required for these endpoints based on the current implementation,
              but ensure you handle any future changes.
            </div>
          </div>

          <section className="docs-section">
            <h2>1. How to Connect to the WebSocket</h2>
            <p>
              The WebSocket provides real-time updates for products associated
              with a video stream. It pushes messages when new products are
              detected or updated.
            </p>

            <ul>
              <li>
                <strong>WebSocket URL:</strong>{" "}
                <code>
                  wss://slave-ws-service-342233178764.us-west1.run.app
                </code>
              </li>
              <li>
                <strong>Protocol:</strong> WebSocket Secure (WSS) over TLS.
              </li>
              <li>
                <strong>Connection Setup:</strong>
                <ul>
                  <li>
                    Create a WebSocket client in your preferred language (e.g.,
                    JavaScript, Python, etc.).
                  </li>
                  <li>
                    Handle reconnections: The connection may close due to
                    network issues. Implement automatic reconnection logic
                    (e.g., retry every 5 seconds on close).
                  </li>
                  <li>
                    Error Handling: Log and handle WebSocket errors (e.g.,
                    connection failures).
                  </li>
                </ul>
              </li>
            </ul>

            <div className="code-section">
              <h4>JavaScript Example (Browser or Node.js)</h4>
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["js-websocket"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `const wsUrl = 'wss://slave-ws-service-342233178764.us-west1.run.app';
let ws;

function initializeWebSocket(channelId) {
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('Connected to WebSocket');
    // Send subscription messages (see Section 2)
    ws.send(JSON.stringify({ "subscribe": \`product-\${channelId}\` }));
    // Optionally subscribe to other topics like shopping-ai-status or face
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Process product messages (see Section 3)
    if ('id' in data) {
      console.log('Received product:', data);
      // Handle the product data (e.g., display in UI)
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed. Reconnecting...');
    setTimeout(() => initializeWebSocket(channelId), 5000);
  };
  
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };
}

// Usage: Call with your channelId
// initializeWebSocket('your-channel-id-here');`,
                      "js-websocket"
                    )
                  }
                >
                  {copiedStates["js-websocket"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["js-websocket"] ? "Copied!" : "Copy"}
                </button>
                <code>{`const wsUrl = 'wss://slave-ws-service-342233178764.us-west1.run.app';
let ws;

function initializeWebSocket(channelId) {
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('Connected to WebSocket');
    // Send subscription messages (see Section 2)
    ws.send(JSON.stringify({ "subscribe": \`product-\${channelId}\` }));
    // Optionally subscribe to other topics like shopping-ai-status or face
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Process product messages (see Section 3)
    if ('id' in data) {
      console.log('Received product:', data);
      // Handle the product data (e.g., display in UI)
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed. Reconnecting...');
    setTimeout(() => initializeWebSocket(channelId), 5000);
  };
  
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };
}

// Usage: Call with your channelId
// initializeWebSocket('your-channel-id-here');`}</code>
              </pre>
            </div>

            <div className="code-section">
              <h4>Python Example (using websockets library)</h4>
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["python-websocket"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `import asyncio
import websockets
import json

async def connect_websocket(channel_id):
    uri = "wss://slave-ws-service-342233178764.us-west1.run.app"
    async with websockets.connect(uri) as ws:
        print("Connected to WebSocket")
        await ws.send(json.dumps({"subscribe": f"product-{channel_id}"}))
        
        while True:
            message = await ws.recv()
            data = json.loads(message)
            if "id" in data:
                print("Received product:", data)
                # Handle product data

# Usage: Run with your channelId
# asyncio.run(connect_websocket("your-channel-id-here"))`,
                      "python-websocket"
                    )
                  }
                >
                  {copiedStates["python-websocket"] ? (
                    <CheckIcon />
                  ) : (
                    <CopyIcon />
                  )}
                  {copiedStates["python-websocket"] ? "Copied!" : "Copy"}
                </button>
                <code>{`import asyncio
import websockets
import json

async def connect_websocket(channel_id):
    uri = "wss://slave-ws-service-342233178764.us-west1.run.app"
    async with websockets.connect(uri) as ws:
        print("Connected to WebSocket")
        await ws.send(json.dumps({"subscribe": f"product-{channel_id}"}))
        
        while True:
            message = await ws.recv()
            data = json.loads(message)
            if "id" in data:
                print("Received product:", data)
                # Handle product data

# Usage: Run with your channelId
# asyncio.run(connect_websocket("your-channel-id-here"))`}</code>
              </pre>
            </div>
          </section>

          <section className="docs-section">
            <h2>2. What to Send to Initiate Connection</h2>
            <p>
              After establishing the WebSocket connection (on the{" "}
              <code>onopen</code> event), send subscription messages to receive
              updates for a specific channel. Subscriptions are sent as JSON
              objects.
            </p>

            <h3>Required Subscription for Products</h3>
            <div className="subscription-box">
              <p>
                Send a JSON message to subscribe to the product topic for your
                channel:
              </p>
              <code>{`{"subscribe": "product-<channelId>"}`}</code>
              <p>
                <strong>Example:</strong> If <code>channelId</code> is{" "}
                <code>ba398d25-ef88-4762-bcd6-d75a2930fbeb</code>, send:
              </p>
              <code>{`{"subscribe": "product-ba398d25-ef88-4762-bcd6-d75a2930fbeb"}`}</code>
            </div>

            <h3>Optional Subscriptions</h3>
            <ul>
              <li>
                <strong>Shopping AI Status:</strong>{" "}
                <code>{`{"subscribe": "shopping-ai-status-<channelId>"}`}</code>{" "}
                (receives AI processing status updates, e.g.,{" "}
                <code>{`{"ai": "Connected!"}`}</code>)
              </li>
              <li>
                <strong>Face Recognition:</strong>{" "}
                <code>{`{"subscribe": "face-<channelId>"}`}</code> (receives
                face data, not covered in this doc)
              </li>
            </ul>

            <div className="note-box">
              No initial handshake or authentication is required beyond the
              subscription. Send these as soon as the connection opens.
            </div>

            <h3>Example in JavaScript:</h3>
            <div className="code-section">
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["js-subscribe"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `ws.send(JSON.stringify({ "subscribe": \`product-\${channelId}\` }));`,
                      "js-subscribe"
                    )
                  }
                >
                  {copiedStates["js-subscribe"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["js-subscribe"] ? "Copied!" : "Copy"}
                </button>
                <code>{`ws.send(JSON.stringify({ "subscribe": \`product-\${channelId}\` }));`}</code>
              </pre>
            </div>
          </section>

          <section className="docs-section">
            <h2>3. Format of Product Messages</h2>
            <p>
              Product messages are received via the WebSocket as JSON objects.
              They represent products detected or recommended in the video
              stream (e.g., via AI analysis).
            </p>

            <ul>
              <li>
                <strong>Trigger:</strong> Messages are pushed when a new product
                is available for the subscribed channel.
              </li>
              <li>
                <strong>JSON Structure:</strong> The root object contains
                product details. Key fields include:
              </li>
            </ul>

            <div className="field-list">
              <div className="field-item">
                <div>
                  <code>id</code> <span className="field-type">(string)</span>
                </div>
                <div className="field-description">
                  Unique product ID (required; if present, it's a product
                  message)
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>title</code>{" "}
                  <span className="field-type">(string)</span>
                </div>
                <div className="field-description">Product name or title</div>
              </div>
              <div className="field-item">
                <div>
                  <code>image</code>{" "}
                  <span className="field-type">(string)</span>
                </div>
                <div className="field-description">
                  URL to the product image
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>link</code> <span className="field-type">(string)</span>
                </div>
                <div className="field-description">
                  Affiliate or direct link to the product
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>explanation</code>{" "}
                  <span className="field-type">(string)</span>
                </div>
                <div className="field-description">
                  AI-generated description or reason for recommendation
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>price</code>{" "}
                  <span className="field-type">(number or string)</span>
                </div>
                <div className="field-description">
                  Product price (may be null or empty)
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>currency</code>{" "}
                  <span className="field-type">(string)</span>
                </div>
                <div className="field-description">
                  Currency code (e.g., "USD"; defaults to "USD" if missing)
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>type</code>{" "}
                  <span className="field-type">(string, optional)</span>
                </div>
                <div className="field-description">
                  Product type (e.g., "ticket" for events, "deal" for coupons;
                  absent for standard products)
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>domain_url</code>{" "}
                  <span className="field-type">(string, optional)</span>
                </div>
                <div className="field-description">
                  Domain of the product link (for vendor logos)
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>logo_url</code>{" "}
                  <span className="field-type">(string, optional)</span>
                </div>
                <div className="field-description">
                  Direct URL to vendor logo (fallback if domain_url is missing)
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>back_image</code>{" "}
                  <span className="field-type">(string, optional)</span>
                </div>
                <div className="field-description">
                  URL to a secondary/back image
                </div>
              </div>
              <div className="field-item">
                <div>
                  <code>matchType</code>{" "}
                  <span className="field-type">(string, optional)</span>
                </div>
                <div className="field-description">
                  Match category (e.g., "SAW", "HEARD", "LOCATION", "IDEA",
                  "INSIGHT")
                </div>
                <h4>Type-Specific Fields</h4>
                <ul>
                  <li>
                    For <code>type: "ticket"</code>: <code>date</code> (object
                    or ISO string: e.g.,{" "}
                    <code>{`{date: "YYYY-MM-DD", time: "HH:MM"}`}</code> or
                    "YYYY-MM-DDTHH:MM:SS"), <code>location</code> (string)
                  </li>
                  <li>
                    For <code>type: "deal"</code>: <code>vendor_name</code>{" "}
                    (string), <code>location</code> (string),{" "}
                    <code>coupon</code> (string), <code>description</code>{" "}
                    (string), <code>terms</code> (string)
                  </li>
                </ul>
              </div>
            </div>

            <div className="code-section">
              <h4>Example: Standard Product</h4>
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["json-standard"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `{
  "id": "12345",
  "title": "Wireless Headphones",
  "image": "https://example.com/headphones.jpg",
  "link": "https://amazon.com/product/12345",
  "explanation": "These headphones were mentioned in the video for their noise-cancellation feature.",
  "price": 99.99,
  "currency": "USD",
  "domain_url": "amazon.com",
  "matchType": "HEARD"
}`,
                      "json-standard"
                    )
                  }
                >
                  {copiedStates["json-standard"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["json-standard"] ? "Copied!" : "Copy"}
                </button>
                <code>{`{
  "id": "12345",
  "title": "Wireless Headphones",
  "image": "https://example.com/headphones.jpg",
  "link": "https://amazon.com/product/12345",
  "explanation": "These headphones were mentioned in the video for their noise-cancellation feature.",
  "price": 99.99,
  "currency": "USD",
  "domain_url": "amazon.com",
  "matchType": "HEARD"
}`}</code>
              </pre>
            </div>

            <div className="code-section">
              <h4>Example: Ticket Type</h4>
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["json-ticket"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `{
  "id": "67890",
  "type": "ticket",
  "title": "Concert Ticket",
  "image": "https://example.com/ticket.jpg",
  "link": "https://viator.com/ticket/67890",
  "date": "2025-09-01T19:00:00",
  "location": "New York, NY",
  "explanation": "Event matching the video's location discussion."
}`,
                      "json-ticket"
                    )
                  }
                >
                  {copiedStates["json-ticket"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["json-ticket"] ? "Copied!" : "Copy"}
                </button>
                <code>{`{
  "id": "67890",
  "type": "ticket",
  "title": "Concert Ticket",
  "image": "https://example.com/ticket.jpg",
  "link": "https://viator.com/ticket/67890",
  "date": "2025-09-01T19:00:00",
  "location": "New York, NY",
  "explanation": "Event matching the video's location discussion."
}`}</code>
              </pre>
            </div>

            <div className="code-section">
              <h4>Example: Deal Type</h4>
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["json-deal"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `{
  "id": "11223",
  "type": "deal",
  "title": "50% Off Coupon",
  "image": "https://example.com/coupon.jpg",
  "link": "https://example.com/deal/11223",
  "vendor_name": "Local Store",
  "date": {"date": "2025-09-01", "time": "10:00"},
  "location": "Online",
  "coupon": "SAVE50",
  "description": "Discount on selected items.",
  "terms": "Valid until end of month."
}`,
                      "json-deal"
                    )
                  }
                >
                  {copiedStates["json-deal"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["json-deal"] ? "Copied!" : "Copy"}
                </button>
                <code>{`{
  "id": "11223",
  "type": "deal",
  "title": "50% Off Coupon",
  "image": "https://example.com/coupon.jpg",
  "link": "https://example.com/deal/11223",
  "vendor_name": "Local Store",
  "date": {"date": "2025-09-01", "time": "10:00"},
  "location": "Online",
  "coupon": "SAVE50",
  "description": "Discount on selected items.",
  "terms": "Valid until end of month."
}`}</code>
              </pre>
            </div>

            <h3>Processing Tips</h3>
            <ul>
              <li>
                Parse the message with <code>JSON.parse(event.data)</code> (JS)
                or equivalent
              </li>
              <li>
                Queue or debounce processing to handle bursts (e.g., limit to 10
                recent products)
              </li>
              <li>
                Handle missing fields gracefully (e.g., hide price if null)
              </li>
              <li>
                For images: Preload to avoid UI flicker; use placeholders for
                errors
              </li>
            </ul>
          </section>

          <section className="docs-section">
            <h2>4. How to Get Recent Products</h2>
            <p>
              Use the REST API to fetch a list of recent products for a channel
              (e.g., for initial load or historical view).
            </p>

            <ul>
              <li>
                <strong>Endpoint:</strong>
                <code className="endpoint">
                  GET
                  https://fastapi.edgevideo.ai/product_search/recent_products/
                  {`{channelId}`}/{`{limit}`}
                </code>
                <ul>
                  <li>
                    <code>{`{channelId}`}</code> (required, string): The channel
                    ID.
                  </li>
                  <li>
                    <code>{`{limit}`}</code> (required, integer): Maximum number
                    of recent products to return (e.g., 4; max may vary, test
                    for limits).
                  </li>
                </ul>
              </li>
              <li>
                <strong>Headers:</strong> None required (no auth in current
                impl).
              </li>
              <li>
                <strong>Response:</strong> JSON array of product objects (same
                format as WebSocket product messages, see Section 3).
              </li>
              <li>
                <strong>Error Handling:</strong> Check HTTP status (e.g., 404 if
                channel not found); parse errors from response body.
              </li>
            </ul>

            <h3>Example in JavaScript (Fetch API):</h3>
            <div className="code-section">
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["js-fetch"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `async function getRecentProducts(channelId, limit = 4) {
  try {
    const response = await fetch(\`https://fastapi.edgevideo.ai/product_search/recent_products/\${channelId}/\${limit}\`);
    if (!response.ok) {
      throw new Error(\`Failed with status \${response.status}\`);
    }
    const products = await response.json();
    console.log('Recent products:', products);
    // Process products (e.g., display in UI)
    return products;
  } catch (error) {
    console.error('Error fetching recent products:', error);
  }
}

// Usage:
// await getRecentProducts('your-channel-id-here', 10);`,
                      "js-fetch"
                    )
                  }
                >
                  {copiedStates["js-fetch"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["js-fetch"] ? "Copied!" : "Copy"}
                </button>
                <code>{`async function getRecentProducts(channelId, limit = 4) {
  try {
    const response = await fetch(\`https://fastapi.edgevideo.ai/product_search/recent_products/\${channelId}/\${limit}\`);
    if (!response.ok) {
      throw new Error(\`Failed with status \${response.status}\`);
    }
    const products = await response.json();
    console.log('Recent products:', products);
    // Process products (e.g., display in UI)
    return products;
  } catch (error) {
    console.error('Error fetching recent products:', error);
  }
}

// Usage:
// await getRecentProducts('your-channel-id-here', 10);`}</code>
              </pre>
            </div>

            <div className="code-section">
              <h4>Example Response</h4>
              <pre>
                <button
                  className={`copy-button ${
                    copiedStates["json-response"] ? "copied" : ""
                  }`}
                  onClick={() =>
                    copyToClipboard(
                      `[
  {
    "id": "12345",
    "title": "Wireless Headphones",
    "image": "https://example.com/headphones.jpg",
    // ... other fields as in Section 3
  },
  // ... more products
]`,
                      "json-response"
                    )
                  }
                >
                  {copiedStates["json-response"] ? <CheckIcon /> : <CopyIcon />}
                  {copiedStates["json-response"] ? "Copied!" : "Copy"}
                </button>
                <code>{`[
  {
    "id": "12345",
    "title": "Wireless Headphones",
    "image": "https://example.com/headphones.jpg",
    // ... other fields as in Section 3
  },
  // ... more products
]`}</code>
              </pre>
            </div>

            <h3>Tips</h3>
            <ul>
              <li>
                Call this on page load or when channelId becomes available.
              </li>
              <li>
                Combine with WebSocket: Fetch recent products first, then
                subscribe for real-time updates.
              </li>
              <li>
                Poll if WebSocket unavailable (but prefer WebSocket for
                efficiency).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
