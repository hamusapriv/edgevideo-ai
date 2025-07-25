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
} from "./modules/productsModule";
import {
  setupLoginHandling,
  showLoggedOutState,
} from "./modules/googleAuthModule";
import { getChannelId } from "./modules/useChannelModule";

const wsUrl = "wss://slave-ws-service-342233178764.us-west1.run.app"; // WebSocket server URL

// Global WebSocket instance for managing connections
let currentWebSocket = null;

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
  edgeConsole.log("Attempting to fetch all voted items (Products, Viator)...");
  const token = localStorage.getItem("authToken");
  if (!token) {
    edgeConsole.log("Fetch voted items skipped: No auth token found.");
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
        edgeConsole.log(
          `Successfully fetched ${data.length} items from ${url}.`
        );
        combinedVotes = combinedVotes.concat(data);
      } else {
        // Handle network errors or other fetch rejections
        edgeConsole.error(`Workspace rejected for ${url}:`, result.reason);
        encounteredError = true;
      }
    }

    // Update the global array with the combined results
    votedProducts = combinedVotes;
    edgeConsole.log(`Total voted items fetched: ${votedProducts.length}.`);

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

/**
 * Determines the item type name based on product data.
 * Ensure these names match your `click_types` table.
 * @param {object} productData - The product/ticket/deal object.
 * @returns {string|null} The type name or null if undetermined.
 */
function getItemTypeName(productData) {
  if (!productData || !productData.id) {
    edgeConsole.error("getItemTypeName: Invalid product data received.");
    return null;
  }

  let itemTypeName = "";

  // Determine the click type name based on product type and link source
  if (productData.type === "ticket") {
    // Use optional chaining ?. in case link is missing
    itemTypeName = productData.link?.toLowerCase().includes("viator")
      ? "Viator Ticket"
      : "DB Ticket";
  } else if (productData.type === "deal") {
    itemTypeName = "Deal";
  } else {
    // Default to product type (assume 'product' or undefined type)
    // itemTypeName = productData.link?.toLowerCase().includes('amazon') ? 'Amazon Product' : 'DB Product';
    itemTypeName = "DB Product";
  }

  // Basic check if a type was determined
  if (!itemTypeName) {
    edgeConsole.error(
      "getItemTypeName: Could not determine type for item:",
      productData
    );
    return null;
  }

  return itemTypeName;
}

function hideConsoleMessages() {
  if (!window.location.search.toLowerCase().includes("debug")) {
    edgeConsole.log = () => {};
    edgeConsole.info = () => {};
    edgeConsole.error = () => {};
  }
}

// hideConsoleMessages();

let downvotedIds = [];

function SetShoppingAIStatus(messageText) {
  let elm = document.getElementById("aiStatusTextShopping");

  if (elm != null) {
    elm.innerText = messageText;
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
    setTimeout(getCachedProducts, 100);
  }
}

function initializeWebSocket() {
  // Get current channel ID dynamically
  const channelId = getChannelId();

  // Close existing WebSocket if it exists
  if (currentWebSocket && currentWebSocket.readyState === WebSocket.OPEN) {
    edgeConsole.log("Closing existing WebSocket connection for channel switch");
    currentWebSocket.close();
    currentWebSocket = null;
  }

  //channelId = "ba398d25-ef88-4762-bcd6-d75a2930fbeb";
  if (typeof channelId !== "undefined" && channelId !== null) {
    // channelId is defined and is not null
    // Reduced logging - only log once during WebSocket initialization
  } else {
    // channelId is either undefined or null
    edgeConsole.log("channelId undefined or null...");
    setTimeout(initializeWebSocket, 1000);
    return;
  }

  let ws = new WebSocket(wsUrl);
  currentWebSocket = ws;

  ws.onopen = function open() {
    edgeConsole.log("Connected to the WebSocket server");
    SetShoppingAIStatus("Connected!");
    ws.send(JSON.stringify({ subscribe: `product-${channelId}` }));
    ws.send(JSON.stringify({ subscribe: `shopping-ai-status-${channelId}` }));
    ws.send(JSON.stringify({ subscribe: `face-${channelId}` }));
  };

  ws.onmessage = async function incoming(event) {
    try {
      let data = JSON.parse(event.data); // Use event.data to access the message content

      // Removed excessive logging of product data

      if ("ai" in data) {
        SetShoppingAIStatus(data.ai);
      } else if ("face" in data) {
        addToFaceDataQueue(data.face);
      } else if ("id" in data) {
        addToProductDataQueue(data);
        processProductDataQueue();
      }
    } catch (err) {
      edgeConsole.error("Error processing incoming message:", err);
    }
  };

  ws.onclose = function close() {
    edgeConsole.log(
      "Disconnected from the WebSocket server. Attempting to reconnect..."
    );
    setTimeout(initializeWebSocket, 5000);
  };

  ws.onerror = function error(err) {
    edgeConsole.error("WebSocket error:", err);
  };
}

// Product vendor store logo
async function getRedirectedDomain(initialUrl) {
  try {
    const response = await fetch(
      `http://localhost:3000/getRedirectedDomain?url=${encodeURIComponent(
        initialUrl
      )}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data.domain;
  } catch (error) {
    edgeConsole.error("Error in getting redirected domain:", error);
    return null;
  }
}

function extractDomainFromParameter(url) {
  // Try to match the existing pattern
  let regex = /[?&](?:u|r)=https%3A%2F%2F([^%]+)/;
  let match = url.match(regex);
  if (!match) {
    // Try to match the new pattern
    regex = /\/destination:([^\s]+)/;
    match = url.match(regex);
  }
  if (match) {
    // Decode the extracted part using match[1]
    const decodedUrl = decodeURIComponent(match[1]);
    edgeConsole.log(`Extracted and decoded URL: ${decodedUrl}`);
    let urlToParse = decodedUrl;
    // If decodedUrl does not start with 'http://' or 'https://', add 'https://'
    if (
      !decodedUrl.startsWith("http://") &&
      !decodedUrl.startsWith("https://")
    ) {
      urlToParse = "https://" + decodedUrl;
    }
    // Use the URL object to extract the hostname (domain)
    const domain = new URL(urlToParse).hostname;
    return domain;
  }
  edgeConsole.log(`No match found in URL: ${url}`);
  return null; // Return null if no match is found
}

function extractDomain(url) {
  // Create a new URL object from the input URL
  const parsedUrl = new URL(url);

  // Get the hostname part of the URL
  const hostname = parsedUrl.hostname;

  // Split the hostname into parts
  const parts = hostname.split(".");

  // If the hostname contains more than two parts, return the last two parts
  // Otherwise, return the hostname as is
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  } else {
    return hostname;
  }
}

function AddClassToAll(element, className) {
  // Safety check to ensure element still exists in DOM
  if (!element || !element.parentNode) return;

  try {
    element.classList.add(className);
    element.querySelectorAll("*").forEach((child) => {
      if (child.parentNode) {
        // Check if child is still in DOM
        child.classList.add(className);
      }
    });
  } catch (error) {
    edgeConsole.warn("Error adding class:", error);
  }
}

function RemoveClassFromAll(element, className) {
  // Safety check to ensure element still exists in DOM
  if (!element || !element.parentNode) return;

  try {
    element.classList.remove(className);
    element.querySelectorAll("*").forEach((child) => {
      if (child.parentNode) {
        // Check if child is still in DOM
        child.classList.remove(className);
      }
    });
  } catch (error) {
    edgeConsole.warn("Error removing class:", error);
  }
}

/**
 * Sends click tracking data to the backend endpoint.
 * @param {object} productData - The product/ticket/deal object containing id, link, type, etc.
 */
let trackClickTimeouts = {};

async function trackClick(productData) {
  if (!productData || !productData.id || !productData.link) {
    edgeConsole.error("trackClick failed: Missing essential product data.");
    return; // Don't proceed if data is incomplete
  }

  const itemId = productData.id;

  // Clear any existing timeout for THIS specific itemId.
  // This ensures that if the function is called again quickly for the same item,
  // the previous (pending) tracking action is cancelled.
  if (trackClickTimeouts[itemId]) {
    clearTimeout(trackClickTimeouts[itemId]);
  }

  // Set a new timeout for THIS specific itemId.
  // The actual tracking logic will only execute after the timeout period (e.g., 50ms)
  // if no other calls for the same itemId reset it.
  trackClickTimeouts[itemId] = setTimeout(async () => {
    // --- Start of the original trackClick logic, now inside the debounce timeout ---
    let clickTypeName = ""; // Will be 'DB Product', 'Amazon Product', 'DB Ticket', 'Viator Ticket', or 'Deal'

    // Determine the click type name
    // Note: We use the 'productData' that was passed into this specific call to trackClick,
    // thanks to JavaScript closures.
    if (productData.type === "ticket") {
      if (productData.link.toLowerCase().includes("viator")) {
        clickTypeName = "Viator Ticket";
      } else {
        clickTypeName = "DB Ticket";
      }
    } else if (productData.type === "deal") {
      clickTypeName = "Deal";
    } else {
      // Default to product type
      if (productData.link.toLowerCase().includes("amazon")) {
        clickTypeName = "Amazon Product";
      } else {
        clickTypeName = "DB Product";
      }
    }

    // Ensure a type was determined
    if (!clickTypeName) {
      edgeConsole.error(
        "Debounced trackClick failed: Could not determine click type for item:",
        productData
      );
      // Clean up the stored timeout ID for this item if logic fails here
      delete trackClickTimeouts[itemId];
      return;
    }

    // Prepare the payload for the backend
    const payload = {
      itemId: itemId, // itemId is captured from the outer scope of trackClick
      clickTypeName: clickTypeName,
    };

    // Add channel_id if it's defined globally and not null
    const channelId = getChannelId();
    if (typeof channelId !== "undefined" && channelId !== null) {
      payload.channel_id = channelId;
    }

    edgeConsole.log(
      "Attempting to track click (debounced for item " + itemId + "):",
      payload
    ); // For debugging

    try {
      const response = await fetch(
        "https://fastapi.edgevideo.ai/tracking/click",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if required by your API
          },
          body: JSON.stringify(payload),
          // keepalive: true // Consider if needed
        }
      );

      if (!response.ok) {
        const errorBody = await response.text(); // Get more details on failure
        edgeConsole.error(
          `Debounced click tracking (item ${itemId}) API call failed: ${response.status} ${response.statusText}`,
          errorBody
        );
      } else {
        edgeConsole.log(
          `Debounced click (item ${itemId}) tracked successfully as Type: ${clickTypeName}`
        );
      }
    } catch (error) {
      edgeConsole.error(
        `Network or other error sending debounced click tracking data (item ${itemId}):`,
        error
      );
    }
    // --- End of the original trackClick logic ---

    // Clean up the stored timeout ID for this itemId after execution.
    // This is good practice to prevent the trackClickTimeouts object from growing indefinitely
    // if you have a very large number of unique items clicked over a long session.
    delete trackClickTimeouts[itemId];
  }, 500); // Debounce delay in milliseconds (e.g., 50ms). Adjust as needed.
}

// Debounced version to prevent excessive calls
let updateProductTimeout = null;
function debouncedUpdateProductViaDataRole(i, time = null) {
  if (updateProductTimeout) {
    clearTimeout(updateProductTimeout);
  }

  updateProductTimeout = setTimeout(() => {
    UpdateProductViaDataRole(i, time);
    updateProductTimeout = null;
  }, 16); // 16ms = ~60fps
}

// Check if React is currently updating the DOM
function isReactUpdating() {
  // Check for React Fiber work in progress
  const containers = document.querySelectorAll(
    "[data-reactroot], #root, .react-container"
  );
  for (const container of containers) {
    if (container._reactInternalInstance || container._reactInternalFiber) {
      return true;
    }
  }
  return false;
}

// Expose debounced version
window.debouncedUpdateProductViaDataRole = debouncedUpdateProductViaDataRole;

function UpdateProductViaDataRole(i, time = null) {
  // Simplified approach: Let React handle DOM, screen.js only dispatches events
  
  // Ensure the product exists at index i
  if (!products || i >= products.length || i < 0) {
    edgeConsole.error(
      `UpdateProductViaDataRole: Invalid index ${i} for products array.`
    );
    return;
  }
  
  const product = products[i];
  
  // Dispatch a custom event that React components can listen to
  const productUpdateEvent = new CustomEvent('legacy-product-update', {
    detail: {
      product: product,
      index: i,
      time: time
    }
  });
  
  window.dispatchEvent(productUpdateEvent);
  
  // Also track clicks via existing system (React will handle the UI)
  if (window.trackClick && product) {
    window.currentProduct = product;
  }
}

      productImage.onload = function() {
        // Double-check container still exists before proceeding
        if (!itemContainer.parentNode) {
          edgeConsole.warn(
            "Container was removed before image loaded, skipping update"
          );
          return;
        }

        if (
          productImage.currentSrc &&
          productImage.currentSrc.includes("noimage")
        ) {
          edgeConsole.log('Image contains "noimage", skipping update.');
          return;
        }

        // Define the click handler function within this scope to access 'product' easily
        // This function calls the globally defined trackClick
        function handleProductClick(event) {
          // 'product' here refers to the specific product object for this update cycle
          trackClick(product);
          // Let the default browser action (like following the link) proceed
        }

        // Store references to elements with click handlers for cleanup
        const elementsWithHandlers = [];

        // Safely update product images
        images.forEach((image) => {
          if (!image.parentNode) return; // Skip if element was removed

          image.src = product.image;
          image.setAttribute("data-time", time);
          image.style.cursor = "pointer";

          // Update parent elements with data-time (existing logic)
          let parentElement = image.parentElement;
          while (parentElement && parentElement.parentNode) {
            parentElement.setAttribute("data-time", time);
            parentElement = parentElement.parentElement;
          }

          // *** TRACKING: Add click listener to images ***
          // Remove any existing handlers first
          const existingHandler = image.getAttribute("data-click-handler");
          if (existingHandler) {
            image.removeEventListener("click", window[existingHandler]);
          }

          // Add new handler with unique identifier
          const handlerName = `handler_${
            product.id
          }_${Date.now()}_${Math.random()}`;
          window[handlerName] = handleProductClick;
          image.setAttribute("data-click-handler", handlerName);
          image.addEventListener("click", handleProductClick);
          elementsWithHandlers.push({ element: image, handler: handlerName });
        });

        // Safely update product links
        links.forEach((link) => {
          if (!link.parentNode) return; // Skip if element was removed

          link.href = product.link;
          link.setAttribute("data-time", time);
          if (link.parentElement && link.parentElement.parentNode) {
            link.parentElement.setAttribute("data-time", time);
          }

          // *** TRACKING: Add click listener to main product links ***
          const existingHandler = link.getAttribute("data-click-handler");
          if (existingHandler) {
            link.removeEventListener("click", window[existingHandler]);
          }

          const handlerName = `handler_${
            product.id
          }_${Date.now()}_${Math.random()}`;
          window[handlerName] = handleProductClick;
          link.setAttribute("data-click-handler", handlerName);
          link.addEventListener("click", handleProductClick);
          elementsWithHandlers.push({ element: link, handler: handlerName });
        });

        // Safely update product names
        names.forEach((name) => {
          if (!name.parentNode) return; // Skip if element was removed

          name.innerText = product.title;
          name.setAttribute("data-time", time);
          name.style.cursor = "pointer";

          if (name.parentElement && name.parentElement.parentNode) {
            name.parentElement.setAttribute("data-time", time);
          }

          // *** TRACKING: Add click listener to product names ***
          const existingHandler = name.getAttribute("data-click-handler");
          if (existingHandler) {
            name.removeEventListener("click", window[existingHandler]);
          }

          const handlerName = `handler_${
            product.id
          }_${Date.now()}_${Math.random()}`;
          window[handlerName] = handleProductClick;
          name.setAttribute("data-click-handler", handlerName);
          name.addEventListener("click", handleProductClick);
          elementsWithHandlers.push({ element: name, handler: handlerName });
        });

        // Check if the product is a ticket
        if ("type" in product && product.type === "ticket") {
          edgeConsole.log("Ticket type found");
          if (itemContainer.parentNode) {
            RemoveClassFromAll(itemContainer, "coupon-style"); // Ensure coupon style is removed
            AddClassToAll(itemContainer, "ticket-style");
          }

          // Select all event-related elements
          let eventNames = itemContainer.querySelectorAll(
            '[data-role="event-name"]'
          );
          let eventDates = itemContainer.querySelectorAll(
            '[data-role="event-date"]'
          );
          let eventLocations = itemContainer.querySelectorAll(
            '[data-role="event-location"]'
          );
          let eventLinks = itemContainer.querySelectorAll(
            '[data-role="event-link"]'
          );

          // Update event elements safely
          eventNames.forEach((eventName) => {
            if (eventName.parentNode) {
              eventName.innerText = product.title;
            }
          });
          eventDates.forEach((eventDate) => {
            if (eventDate.parentNode) {
              eventDate.innerText = FormatTicketDateTime(product);
            }
          });
          eventLocations.forEach((eventLocation) => {
            if (eventLocation.parentNode) {
              eventLocation.innerText = product.location;
            }
          });
          eventLinks.forEach((eventLink) => {
            if (!eventLink.parentNode) return;

            eventLink.href = product.link;

            // *** TRACKING: Add click listener to ticket links ***
            const existingHandler = eventLink.getAttribute(
              "data-click-handler"
            );
            if (existingHandler) {
              eventLink.removeEventListener("click", window[existingHandler]);
            }

            const handlerName = `handler_${
              product.id
            }_${Date.now()}_${Math.random()}`;
            window[handlerName] = handleProductClick;
            eventLink.setAttribute("data-click-handler", handlerName);
            eventLink.addEventListener("click", handleProductClick);
            elementsWithHandlers.push({
              element: eventLink,
              handler: handlerName,
            });
          });
        }
        // Check if the product is a deal
        else if ("type" in product && product.type == "deal") {
          edgeConsole.log("Deal type found");
          if (itemContainer.parentNode) {
            RemoveClassFromAll(itemContainer, "ticket-style"); // Ensure ticket style is removed
            AddClassToAll(itemContainer, "coupon-style");
          }

          let dealTitle = itemContainer.querySelectorAll(
            '[data-role="coupon-title"]'
          );
          let dealVendorName = itemContainer.querySelectorAll(
            '[data-role="vendor-name"]'
          );
          let dealDate = itemContainer.querySelectorAll(
            '[data-role="coupon-date"]'
          );
          let dealLocation = itemContainer.querySelectorAll(
            '[data-role="coupon-campaign"]'
          );
          let dealLink = itemContainer.querySelectorAll(
            '[data-role="coupon-link"]'
          );
          let dealType = itemContainer.querySelectorAll(
            '[data-role="coupon-type"]'
          );
          let dealDescription = itemContainer.querySelectorAll(
            '[data-role="coupon-description"]'
          );
          let dealTerms = itemContainer.querySelectorAll(
            '[data-role="coupon-term"]'
          );

          // Update deal elements safely
          dealTitle.forEach((el) => {
            if (el.parentNode) {
              el.innerText = product.title || "No Title Available";
            }
          });
          dealVendorName.forEach((el) => {
            if (el.parentNode) {
              el.innerText = product.vendor_name || "No Vendor Name Available";
            }
          });
          dealDate.forEach((el) => {
            if (el.parentNode) {
              el.innerText = FormatTicketDateTime(product);
            }
          });
          dealLocation.forEach((el) => {
            if (el.parentNode) {
              el.innerText = product.location || "No Location Available";
            }
          });
          dealType.forEach((el) => {
            if (el.parentNode) {
              el.innerText = product.coupon || "No Coupon Available";
            }
          });
          dealDescription.forEach((el) => {
            if (el.parentNode) {
              el.innerText = product.description || " ";
            }
          });
          dealTerms.forEach((el) => {
            if (el.parentNode) {
              el.innerText = product.terms || " ";
            }
          });

          dealLink.forEach((el) => {
            if (!el.parentNode) return;

            el.href = product.link || "#"; // Use # if no link

            // *** TRACKING: Add click listener to deal links ***
            const existingHandler = el.getAttribute("data-click-handler");
            if (existingHandler) {
              el.removeEventListener("click", window[existingHandler]);
            }

            const handlerName = `handler_${
              product.id
            }_${Date.now()}_${Math.random()}`;
            window[handlerName] = handleProductClick;
            el.setAttribute("data-click-handler", handlerName);
            el.addEventListener("click", handleProductClick);
            elementsWithHandlers.push({ element: el, handler: handlerName });
          });
        }
        // Otherwise, treat as a standard product (remove specific styles)
        else {
          if (itemContainer.parentNode) {
            RemoveClassFromAll(itemContainer, "ticket-style");
            RemoveClassFromAll(itemContainer, "coupon-style");
          }
        }

        // --- Resume updating other elements ---

        // Update explanations safely
        explanations.forEach((explanation) => {
          if (explanation.parentNode) {
            explanation.innerText = product.explanation;
          }
        });

        // Update vendor images safely (existing logic)
        vendorImages.forEach((vendorImage) => {
          if (!vendorImage.parentNode) return;

          if (product.domain_url) {
            let domainParts = product.domain_url.split(".");
            let domain = product.domain_url;
            if (domainParts[0] === "www") {
              domainParts.splice(0, 1);
              domain = domainParts.join(".");
            }
            vendorImage.src = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
            vendorImage.onerror = function() {
              this.onerror = null;
              this.src = `https://${product.domain_url}/favicon.ico`;
            };
          } else if (product.logo_url) {
            vendorImage.src = product.logo_url;
          } else {
            vendorImage.src = ""; // Clear src if no logo/domain
            vendorImage.style.display = "none"; // Optionally hide if no image
          }
          // Ensure it's visible if previously hidden
          if (vendorImage.src) vendorImage.style.display = "";
        });

        // Update "More" buttons safely (existing logic)
        moreButtons.forEach((moreButton) => {
          if (moreButton.parentNode) {
            moreButton.href = `https://www.amazon.com/s?k=${encodeURIComponent(
              product.title
            )}`;
          }
        });

        // Like/Dislike/Share buttons are handled by React components now
        if (itemContainer.parentNode) {
          itemContainer.setAttribute("data-product-id", product.id);

          const existingVote = votedProducts.find(
            (v) => String(v.item_id) === String(product.id)
          );
          const voteType = existingVote
            ? existingVote.vote_type === 1
              ? "upvote"
              : existingVote.vote_type === -1
              ? "downvote"
              : "none"
            : "none";
          updateVoteButtonStyles(product.id, voteType);
        }

        // Update price display safely (existing logic)
        if (
          "price" in product &&
          product.price !== null &&
          product.price !== ""
        ) {
          let currency = "currency" in product ? product.currency : "USD"; // Default currency if needed
          let formattedPrice = FormatPrice(product.price, currency);
          prices.forEach((priceDisplay) => {
            if (priceDisplay.parentNode) {
              priceDisplay.innerText = formattedPrice;
              priceDisplay.style.display = "flex"; // Make sure it's visible
            }
          });
          priceContainers.forEach((container) => {
            if (container.parentNode) {
              container.style.display = "flex";
            }
          });
        } else {
          // Hide price if not available
          prices.forEach((priceDisplay) => {
            if (priceDisplay.parentNode) {
              priceDisplay.style.display = "none";
            }
          });
          priceContainers.forEach((container) => {
            if (container.parentNode) {
              container.style.display = "none";
            }
          });
        }

        // Update back images safely
        backImages.forEach((backImage) => {
          if (backImage.parentNode) {
            backImage.src = product.back_image;
          }
        });

        // Update match text safely
        if (
          "matchType" in product &&
          product.matchType !== null &&
          product.matchType !== ""
        ) {
          const allowedTypes = ["SAW", "HEARD", "LOCATION", "IDEA", "INSIGHT"];

          let matchLabel =
            allowedTypes.find((type) => product.matchType.includes(type)) ||
            "INSIGHT"; // find the first, default to INSIGHT which is 'vibe'

          matchTexts.forEach((matchText) => {
            if (matchText.parentNode) {
              matchText.innerHTML = matchLabel;
            }
          });
        }

        // Clean up handlers when elements are removed (attach to MutationObserver)
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const handler = node.getAttribute("data-click-handler");
                if (handler && window[handler]) {
                  delete window[handler];
                }
              }
            });
          });
        });

        if (itemContainer.parentNode) {
          observer.observe(itemContainer, { childList: true, subtree: true });

          // Store observer reference for cleanup
          itemContainer.setAttribute("data-observer-id", Date.now());
        }
      }; // End of productImage.onload

      productImage.onerror = function() {
        edgeConsole.error(
          `Failed to load product image for index ${i}: ${product.image}`
        );
        // Handle image loading error, maybe show a placeholder or skip update?
        // For now, we just log it. The onload won't fire, so no updates will happen.
      };

      // Start loading the product image (use product variable, not products[i])
      if (product && product.image) {
        productImage.src = product.image;
      } else {
        edgeConsole.warn(
          `Skipping update for index ${i} due to missing product or image URL.`
        );
      }
    } catch (error) {
      edgeConsole.error("Error in UpdateProductViaDataRole:", error);
    } finally {
      // Remove the updating flag
      if (itemContainer && itemContainer.parentNode) {
        itemContainer.removeAttribute("data-react-updating");
      }
    }
  });
}

// Expose for other modules that rely on a global function
window.UpdateProductViaDataRole = UpdateProductViaDataRole;

// Cleanup function to remove event handlers and prevent memory leaks
function cleanupProductHandlers() {
  // Clean up all product-related event handlers
  const elementsWithHandlers = document.querySelectorAll(
    "[data-click-handler]"
  );
  elementsWithHandlers.forEach((element) => {
    const handlerName = element.getAttribute("data-click-handler");
    if (handlerName && window[handlerName]) {
      element.removeEventListener("click", window[handlerName]);
      delete window[handlerName];
      element.removeAttribute("data-click-handler");
    }
  });
}

// Expose cleanup function
window.cleanupProductHandlers = cleanupProductHandlers;

// Clean up on page unload
window.addEventListener("beforeunload", cleanupProductHandlers);

// Restore simple helpers for reflecting vote state on desktop
function updateVoteButtonStyles(productId, voteType) {
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
    btn.classList.toggle("clicked", voteType === "upvote");
  });
  dislikeButtons.forEach((btn) => {
    btn.classList.toggle("clicked", voteType === "downvote");
  });
}
window.updateVoteButtonStyles = updateVoteButtonStyles;

function applyInitialVoteStyles() {
  if (!votedProducts.length) return;
  const containers = document.querySelectorAll(
    ".item-container[data-product-id]"
  );
  containers.forEach((c) => {
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
}

/**
 * Updates the visual style of ALL like/dislike buttons on the page
 * matching a specific product ID.
 * Assumes buttons have 'like-button' or 'dislike-button' class
 * and a 'data-product-id' attribute matching the productId.
 * @param {string} productId The ID of the product whose buttons to update.
 * @param {'upvote' | 'downvote' | 'none'} voteType The type of vote to reflect.
 */

// --- NEW: Main Initialization Function ---
function initializeApp() {
  edgeConsole.log("DOM ready, initializing application...");

  initProductsFeature();
  initFacesFeature();
  initAuthFeature();

  hideConsoleMessages();
}

export function initProductsFeature() {
  initializeWebSocket();
  getCachedProducts();
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
