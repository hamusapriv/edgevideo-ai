/* eslint-disable */
import { UpdateFaces, addToFaceDataQueue } from "./modules/facesModule";
import {
  products,
  productDataQueue,
  productsPaused,
  productProcessTimeout,
  PauseProducts,
  UnpauseProducts,
  addToProductDataQueue,
  processProductDataQueue,
  FormatTicketDateTime,
  FormatPrice,
  clearProducts,
} from "./modules/productsModule";
import {
  setupLoginHandling,
  showLoggedOutState,
} from "./modules/googleAuthModule";
import { getChannelId } from "./modules/useChannelModule";
import { isValidImageUrl } from "../utils/imageValidation";

const wsUrl = "wss://slave-ws-service-342233178764.us-west1.run.app"; // WebSocket server URL

// Global WebSocket instance for managing connections
let currentWebSocket = null;
let isManualChannelSwitch = false; // Flag to prevent auto-reconnect during manual switches

// Add these near other configuration variables
const VOTE_TRACKING_BASE_URL = "https://fastapi.edgevideo.ai/tracking";
const VOTED_PRODUCTS_URL = `${VOTE_TRACKING_BASE_URL}/votes/products`;
const VOTED_VIATOR_URL = `${VOTE_TRACKING_BASE_URL}/votes/viator`;

let votedProducts = []; // Stores products fetched from /votes/products

// Basic wrapper around the standard console so legacy code can log
// without relying on a global provided elsewhere. This mirrors the
// definition used in the standalone public script.
let edgeConsole = window.edgeConsole || {
  log: (...args) => window.console.log(...args),
  info: (...args) => window.console.info(...args),
  warn: (...args) => window.console.warn(...args),
  error: (...args) => window.console.error(...args),
  debug: (...args) => window.console.debug(...args),
};
window.edgeConsole = edgeConsole;

/**
 * Fetches the list of ALL voted items (Products, Viator Tickets, etc.)
 * the currently logged-in viewer has voted on.
 * Stores the combined result in the global 'votedProducts' array.
 */
async function fetchVotedProducts() {
  // Renamed conceptually, but function name stays
  const token = localStorage.getItem("authToken");
  if (!token) {
    votedProducts = [];
    return;
  }

  // Array of URLs to fetch from
  const urlsToFetch = [
    VOTED_PRODUCTS_URL,
    VOTED_VIATOR_URL,
    // Add more URLs here if other types get their own endpoints
  ];

  // Common fetch options
  const fetchOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    // Fetch all endpoints concurrently
    const results = await Promise.allSettled(
      urlsToFetch.map((url) => fetch(url, fetchOptions))
    );

    let combinedVotes = [];
    let encounteredError = false;

    // Process results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const url = urlsToFetch[i]; // Keep track of which URL this result is for

      if (result.status === "fulfilled") {
        const response = result.value;

        if (response.status === 401) {
          edgeConsole.error(
            `Workspace voted items failed for ${url}: Unauthorized (401). Token invalid or expired.`
          );
          localStorage.removeItem("authToken");
          showLoggedOutState();
          votedProducts = []; // Clear everything on auth failure
          return; // Stop processing further
        }

        if (!response.ok) {
          const errorData = await response
            .text()
            .catch(() => `Status ${response.status}`);
          edgeConsole.error(
            `Failed to fetch voted items from ${url}: ${response.status} - ${errorData}`
          );
          encounteredError = true; // Mark that an error occurred but continue if others succeed
          continue; // Skip to the next result
        }

        // Add successful results to the combined list
        const data = await response.json();
        combinedVotes = combinedVotes.concat(data);
      } else {
        // Handle network errors or other fetch rejections
        edgeConsole.error(`Workspace rejected for ${url}:`, result.reason);
        encounteredError = true;
      }
    }

    // Update the global array with the combined results
    votedProducts = combinedVotes;

    applyInitialVoteStyles();

    if (encounteredError) {
      edgeConsole.warn(
        "One or more endpoints failed during fetchVotedProducts."
      );
      // Optionally inform the user if needed
    }
  } catch (error) {
    // Catch unexpected errors during Promise.allSettled or JSON parsing
    edgeConsole.error("Unexpected error fetching voted items:", error);
    votedProducts = []; // Clear list on major error
  }
}

function SetShoppingAIStatus(messageText) {
  // Add defensive check to prevent React DOM conflicts
  try {
    let elm = document.getElementById("aiStatusTextShopping");
    if (elm != null && elm.isConnected) {
      elm.innerText = messageText;
    }
  } catch (error) {
    edgeConsole.warn("Failed to update AI status:", error);
  }
}

async function getCachedProducts() {
  const channelId = getChannelId();
  if (typeof channelId !== "undefined" && channelId !== null) {
    let cachedProductResponse = await fetch(
      `https://fastapi.edgevideo.ai/product_search/recent_products/${channelId}/1`
    );
    let cachedProductData = await cachedProductResponse.json();
    for (let cachedProduct of cachedProductData)
      addToProductDataQueue(cachedProduct);
    processProductDataQueue();
  } else {
    // Don't retry if there's no channel - this is expected for demo page without selection
  }
}

function initializeWebSocket() {
  // Get current channel ID dynamically
  const channelId = getChannelId();

  // Close existing WebSocket if it exists
  if (currentWebSocket && currentWebSocket.readyState === WebSocket.OPEN) {
    isManualChannelSwitch = true; // Set flag to prevent auto-reconnect

    // Clear products before switching to avoid mixing products from different channels
    clearProducts();

    currentWebSocket.close();
    currentWebSocket = null;

    // Small delay to ensure the connection is fully closed before creating new one
    setTimeout(() => createNewWebSocket(channelId), 50);
    return;
  }

  createNewWebSocket(channelId);
}

function createNewWebSocket(channelId) {
  if (typeof channelId !== "undefined" && channelId !== null) {
    // channelId is defined and is not null
  } else {
    // channelId is either undefined or null
    setTimeout(initializeWebSocket, 1000);
    return;
  }

  let ws = new WebSocket(wsUrl);
  currentWebSocket = ws;

  ws.onopen = function open() {
    SetShoppingAIStatus("Connected!");

    // Reset manual switch flag once new connection is established
    // But only if we're not currently in a manual switch process
    if (!isManualChannelSwitch) {
      // Normal connection, clear any previous flags
    }

    ws.send(JSON.stringify({ subscribe: `product-${channelId}` }));
    ws.send(JSON.stringify({ subscribe: `shopping-ai-status-${channelId}` }));
    ws.send(JSON.stringify({ subscribe: `face-${channelId}` }));
  };

  ws.onmessage = async function incoming(event) {
    try {
      let data = JSON.parse(event.data);

      if ("ai" in data) {
        SetShoppingAIStatus(data.ai);
      } else if ("face" in data) {
        addToFaceDataQueue(data.face);
      } else if ("id" in data) {
        // Add channel filtering here to prevent products from wrong channels
        const currentChannelId = getChannelId();

        // Only process products that match the current channel
        if (
          data.channel_id &&
          currentChannelId &&
          data.channel_id !== currentChannelId
        ) {
          return;
        }

        addToProductDataQueue(data);
        processProductDataQueue();
      }
    } catch (err) {
      edgeConsole.error("Error processing incoming message:", err);
    }
  };

  ws.onclose = function close() {
    // Only attempt to reconnect if this wasn't a manual channel switch
    if (!isManualChannelSwitch) {
      currentWebSocket = null;
      setTimeout(initializeWebSocket, 5000);
    } else {
      currentWebSocket = null;
      // Keep the flag set for a bit longer to prevent race conditions
      setTimeout(() => {
        isManualChannelSwitch = false;
      }, 1000);
    }
  };

  ws.onerror = function error(err) {
    edgeConsole.error("WebSocket error:", err);
  };
}

/**
 * Sends click tracking data to the backend endpoint.
 * @param {object} productData - The product/ticket/deal object containing id, link, type, etc.
 */
let trackClickTimeouts = {};

async function trackClick(productData) {
  if (!productData || !productData.id || !productData.link) {
    edgeConsole.error("trackClick failed: Missing essential product data.");
    return;
  }

  const itemId = productData.id;

  if (trackClickTimeouts[itemId]) {
    clearTimeout(trackClickTimeouts[itemId]);
  }

  trackClickTimeouts[itemId] = setTimeout(async () => {
    let clickTypeName = "";

    if (productData.type === "ticket") {
      if (productData.link.toLowerCase().includes("viator")) {
        clickTypeName = "Viator Ticket";
      } else {
        clickTypeName = "DB Ticket";
      }
    } else if (productData.type === "deal") {
      clickTypeName = "Deal";
    } else {
      if (productData.link.toLowerCase().includes("amazon")) {
        clickTypeName = "Amazon Product";
      } else {
        clickTypeName = "DB Product";
      }
    }

    if (!clickTypeName) {
      edgeConsole.error(
        "Debounced trackClick failed: Could not determine click type for item:",
        productData
      );
      delete trackClickTimeouts[itemId];
      return;
    }

    const payload = {
      itemId: itemId,
      clickTypeName: clickTypeName,
    };

    const channelId = getChannelId();
    if (typeof channelId !== "undefined" && channelId !== null) {
      payload.channel_id = channelId;
    }

    try {
      const response = await fetch(
        "https://fastapi.edgevideo.ai/tracking/click",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        edgeConsole.error(
          `Click tracking API call failed: ${response.status} ${response.statusText}`,
          errorBody
        );
      }
    } catch (error) {
      edgeConsole.error(`Network error sending click tracking data:`, error);
    }

    delete trackClickTimeouts[itemId];
  }, 500);
}

// REACT-FIRST APPROACH: Let React handle all DOM manipulation
// This function now only dispatches events for React components to handle
function UpdateProductViaDataRole(i, time = null) {
  // Ensure the product exists at index i
  if (!products || i >= products.length || i < 0) {
    edgeConsole.error(
      `UpdateProductViaDataRole: Invalid index ${i} for products array.`
    );
    return;
  }

  const product = products[i];

  // Validate product image before dispatching (like original legacy code)
  if (product.image && !isValidImageUrl(product.image)) {
    return;
  }

  // Dispatch a custom event that React components can listen to
  const productUpdateEvent = new CustomEvent("legacy-product-update", {
    detail: {
      product: product,
      index: i,
      time: time,
    },
  });

  window.dispatchEvent(productUpdateEvent);

  // Also make product available for click tracking (React handles the actual clicks)
  window.currentProduct = product;
}

// Expose global functions for legacy compatibility
window.UpdateProductViaDataRole = UpdateProductViaDataRole;
window.trackClick = trackClick;

// Vote button styles helper for React components to use
function updateVoteButtonStyles(productId, voteType) {
  try {
    if (voteType === 1 || voteType === "1") voteType = "upvote";
    else if (voteType === -1 || voteType === "-1") voteType = "downvote";

    const likeButtons = document.querySelectorAll(
      `[data-role="like"][data-product-id="${productId}"], ` +
        `.like-button[data-product-id="${productId}"], ` +
        `.item-container[data-product-id="${productId}"] .like-button`
    );
    const dislikeButtons = document.querySelectorAll(
      `[data-role="dislike"][data-product-id="${productId}"], ` +
        `.dislike-button[data-product-id="${productId}"], ` +
        `.item-container[data-product-id="${productId}"] .dislike-button`
    );

    likeButtons.forEach((btn) => {
      if (btn && btn.isConnected) {
        btn.classList.toggle("clicked", voteType === "upvote");
      }
    });
    dislikeButtons.forEach((btn) => {
      if (btn && btn.isConnected) {
        btn.classList.toggle("clicked", voteType === "downvote");
      }
    });
  } catch (error) {
    edgeConsole.warn("Failed to update vote button styles:", error);
  }
}
window.updateVoteButtonStyles = updateVoteButtonStyles;

function applyInitialVoteStyles() {
  try {
    if (!votedProducts.length) return;
    const containers = document.querySelectorAll(
      ".item-container[data-product-id]"
    );
    containers.forEach((c) => {
      if (!c || !c.isConnected) return;
      const id = c.getAttribute("data-product-id");
      const vote = votedProducts.find((v) => String(v.item_id) === String(id));
      const vt = vote
        ? vote.vote_type === 1
          ? "upvote"
          : vote.vote_type === -1
          ? "downvote"
          : "none"
        : "none";
      updateVoteButtonStyles(id, vt);
    });
  } catch (error) {
    edgeConsole.warn("Failed to apply initial vote styles:", error);
  }
}

// --- Main Initialization Function ---
function initializeApp() {
  initProductsFeature();
  initFacesFeature();
  initAuthFeature();
}

// Track if channel change listener is already added to prevent duplicates
let channelChangeListenerAdded = false;

export function initProductsFeature() {
  initializeWebSocket();
  getCachedProducts();

  // Add channel change listener only once
  if (!channelChangeListenerAdded) {
    const channelChangeHandler = (event) => {
      const { channelId } = event.detail;

      if (channelId) {
        // Clear products from previous channel
        clearProducts();

        // Reconnect WebSocket for new channel
        initializeWebSocket();
        getCachedProducts();
      } else {
        // Clear products when channel is cleared
        clearProducts();

        // Close WebSocket if channel is cleared
        if (
          currentWebSocket &&
          currentWebSocket.readyState === WebSocket.OPEN
        ) {
          currentWebSocket.close();
          currentWebSocket = null;
        }
      }
    };

    window.addEventListener("channel-changed", channelChangeHandler);
    channelChangeListenerAdded = true;

    // Store handler reference for potential cleanup
    window.channelChangeHandler = channelChangeHandler;
  }
}

export function initFacesFeature() {
  setInterval(UpdateFaces, 1000);
}

export function initAuthFeature() {
  setupLoginHandling(fetchVotedProducts);
}

export function startScreen() {
  initializeApp();
}

export { UpdateProductViaDataRole };
