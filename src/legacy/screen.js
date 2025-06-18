/* eslint-disable */
import { UpdateFaces, addToFaceDataQueue } from "./modules/faces";
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
} from "./modules/products";
import { setupLoginHandling, showLoggedOutState } from "./modules/googleAuth";
import { updateVoteButtonStyles } from "../services/voteService";
// Inject channelId into window for any non-React scripts
(function() {
  const DEFAULT_CHANNEL_ID =
    window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";
  const params = new URLSearchParams(window.location.search);
  let channelId = params.get("channelId") || DEFAULT_CHANNEL_ID;
  try {
    localStorage.setItem("channelId", channelId);
  } catch {}
  window.channelId = channelId;
})();

const wsUrl = "wss://slave-ws-service-342233178764.us-west1.run.app"; // WebSocket server URL

// Add these near other configuration variables
const VOTE_TRACKING_BASE_URL = "https://fastapi.edgevideo.ai/tracking";
const UPVOTE_URL = `${VOTE_TRACKING_BASE_URL}/vote/up`;
const DOWNVOTE_URL = `${VOTE_TRACKING_BASE_URL}/vote/down`;
const VOTED_PRODUCTS_URL = `${VOTE_TRACKING_BASE_URL}/votes/products`;
const VOTED_VIATOR_URL = `${VOTE_TRACKING_BASE_URL}/votes/viator`;
const REMOVE_VOTE_URL = `${VOTE_TRACKING_BASE_URL}/vote`;

let votedProducts = []; // Stores products fetched from /votes/products

// Basic wrapper around the standard console so legacy code can log
// without relying on a global provided elsewhere. This mirrors the
// definition used in the standalone public script.
let edgeConsole = {
  log: (...args) => window.console.log(...args),
  info: (...args) => window.console.info(...args),
  error: (...args) => window.console.error(...args),
  // add warn, debug, etc. as needed
};

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

    // **Recommendation:** Remove this call, rely on UpdateProductViaDataRole for styling
    // applyInitialVoteStyles();

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
  if (typeof channelId !== "undefined" && channelId !== null) {
    let cachedProductResponse = await fetch(
      `https://fastapi.edgevideo.ai/product_search/recent_products/${channelId}/4`
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
  //channelId = "ba398d25-ef88-4762-bcd6-d75a2930fbeb";
  if (typeof channelId !== "undefined" && channelId !== null) {
    // channelId is defined and is not null
    edgeConsole.log("channelId is defined and not null:", channelId);
  } else {
    // channelId is either undefined or null
    // edgeConsole.log('channelId is either undefined or null');
    edgeConsole.log("channelId undefined or null...");
    setTimeout(initializeWebSocket, 1000);
    return;
  }

  let ws = new WebSocket(wsUrl);

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

      edgeConsole.log(data);

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
  element.classList.add(className);
  element.querySelectorAll("*").forEach((child) => {
    child.classList.add(className);
  });
}

function RemoveClassFromAll(element, className) {
  element.classList.remove(className);
  element.querySelectorAll("*").forEach((child) => {
    child.classList.remove(className);
  });
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

function UpdateProductViaDataRole(i, time = null) {
  let itemContainer = document.querySelector(".product0");

  if (!itemContainer) {
    edgeConsole.warn(
      "UpdateProductViaDataRole: .product0 container not found"
    );
    return;
  }

  // Select all elements within the item container using data-role attributes
  let images = itemContainer.querySelectorAll('[data-role="product-image"]');
  let backImages = itemContainer.querySelectorAll('[data-role="frame-image"]');
  let links = itemContainer.querySelectorAll('[data-role="product-link"]');
  let names = itemContainer.querySelectorAll('[data-role="product-name"]');
  let moreButtons = itemContainer.querySelectorAll('[data-role="more-link"]');
  let explanations = itemContainer.querySelectorAll(
    '[data-role="ai-description"]'
  );
  let vendorImages = itemContainer.querySelectorAll(
    '[data-role="vendor-logo"]'
  );
  let prices = itemContainer.querySelectorAll('[data-role="product-price"]');
  let priceContainers = itemContainer.querySelectorAll(
    '[data-role="product-price-container"]'
  );
  let matchTexts = itemContainer.querySelectorAll('[data-role="matchText"]');

  // Ensure the product exists at index i
  if (!products || i >= products.length || i < 0) {
    edgeConsole.error(
      `UpdateProductViaDataRole: Invalid index ${i} for products array.`
    );
    return;
  }
  let product = products[i]; // Get product data early

  // Preload the main product image
  let productImage = new Image();

  productImage.onload = function() {
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

    // Update product images
    images.forEach((image) => {
      image.src = product.image;
      image.setAttribute("data-time", time);
      image.style.cursor = "pointer";

      // Update parent elements with data-time (existing logic)
      let parentElement = image.parentElement;
      while (parentElement) {
        parentElement.setAttribute("data-time", time);
        parentElement = parentElement.parentElement;
      }

      // *** TRACKING: Add click listener to images ***
      image.removeEventListener("click", handleProductClick); // Prevent duplicates
      image.addEventListener("click", handleProductClick);
    });

    // Update product links
    links.forEach((link) => {
      link.href = product.link;
      link.setAttribute("data-time", time);
      if (link.parentElement) {
        link.parentElement.setAttribute("data-time", time);
      }
      // *** TRACKING: Add click listener to main product links ***
      link.removeEventListener("click", handleProductClick); // Prevent duplicates
      link.addEventListener("click", handleProductClick);
    });

    // Update product names (assuming they should also act as links)
    names.forEach((name) => {
      name.innerText = product.title;
      name.setAttribute("data-time", time);
      name.style.cursor = "pointer";

      if (name.parentElement) {
        name.parentElement.setAttribute("data-time", time);
      }
      // *** TRACKING: Add click listener to product names ***
      name.removeEventListener("click", handleProductClick); // Prevent duplicates
      name.addEventListener("click", handleProductClick);
    });

    // Check if the product is a ticket
    if ("type" in product && product.type === "ticket") {
      edgeConsole.log("Ticket type found");
      RemoveClassFromAll(itemContainer, "coupon-style"); // Ensure coupon style is removed
      AddClassToAll(itemContainer, "ticket-style");

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

      // Update event elements
      eventNames.forEach((eventName) => {
        eventName.innerText = product.title;
      });
      eventDates.forEach((eventDate) => {
        eventDate.innerText = FormatTicketDateTime(product);
      });
      eventLocations.forEach((eventLocation) => {
        eventLocation.innerText = product.location;
      });
      eventLinks.forEach((eventLink) => {
        eventLink.href = product.link;
        // *** TRACKING: Add click listener to ticket links ***
        eventLink.removeEventListener("click", handleProductClick); // Prevent duplicates
        eventLink.addEventListener("click", handleProductClick);
      });
    }
    // Check if the product is a deal
    else if ("type" in product && product.type == "deal") {
      edgeConsole.log("Deal type found");
      RemoveClassFromAll(itemContainer, "ticket-style"); // Ensure ticket style is removed
      AddClassToAll(itemContainer, "coupon-style");

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

      // Update deal elements
      dealTitle.forEach((el) => {
        el.innerText = product.title || "No Title Available";
      });
      dealVendorName.forEach((el) => {
        el.innerText = product.vendor_name || "No Vendor Name Available";
      });
      dealDate.forEach((el) => {
        el.innerText = FormatTicketDateTime(product);
      });
      dealLocation.forEach((el) => {
        el.innerText = product.location || "No Location Available";
      });
      dealType.forEach((el) => {
        el.innerText = product.coupon || "No Coupon Available";
      });
      dealDescription.forEach((el) => {
        el.innerText = product.description || " ";
      });
      dealTerms.forEach((el) => {
        el.innerText = product.terms || " ";
      });

      dealLink.forEach((el) => {
        // Note: Using product.link which was globally available, not products[i].link
        el.href = product.link || "#"; // Use # if no link
        // *** TRACKING: Add click listener to deal links ***
        el.removeEventListener("click", handleProductClick); // Prevent duplicates
        el.addEventListener("click", handleProductClick);
      });
    }
    // Otherwise, treat as a standard product (remove specific styles)
    else {
      RemoveClassFromAll(itemContainer, "ticket-style");
      RemoveClassFromAll(itemContainer, "coupon-style");
    }

    // --- Resume updating other elements ---

    // Update explanations
    explanations.forEach((explanation) => {
      explanation.innerText = product.explanation;
    });

    // Update vendor images (existing logic)
    vendorImages.forEach((vendorImage) => {
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

    // Update "More" buttons (existing logic - these likely don't need the main product click tracking)
    moreButtons.forEach((moreButton) => {
      moreButton.href = `https://www.amazon.com/s?k=${encodeURIComponent(
        product.title
      )}`;
    });

    // Like/Dislike/Share buttons are handled by React components now
    itemContainer.setAttribute("data-product-id", product.id);

    // Update price display (existing logic)
    if ("price" in product && product.price !== null && product.price !== "") {
      let currency = "currency" in product ? product.currency : "USD"; // Default currency if needed
      let formattedPrice = FormatPrice(product.price, currency);
      prices.forEach((priceDisplay) => {
        priceDisplay.innerText = formattedPrice;
        priceDisplay.style.display = "flex"; // Make sure it's visible
      });
      priceContainers.forEach((container) => {
        container.style.display = "flex";
      });
    } else {
      // Hide price if not available
      prices.forEach((priceDisplay) => {
        priceDisplay.style.display = "none";
      });
      priceContainers.forEach((container) => {
        container.style.display = "none";
      });
    }

    // Update back images (use product variable, not products[i])
    backImages.forEach((backImage) => {
      backImage.src = product.back_image;
    });

    // If we're including a label then use it
    // If we're including a label then use it
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
        matchText.innerHTML = matchLabel;
      });
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
}

// Expose for other modules that rely on a global function
window.UpdateProductViaDataRole = UpdateProductViaDataRole;

/**
 * Applies the initial vote button styles based on the fetched votedProducts list.
 * Call this after votedProducts is populated.
 */
function applyInitialVoteStyles() {
  if (!votedProducts || votedProducts.length === 0) return;

  edgeConsole.log("Applying initial vote styles based on fetched data...");

  // Assuming the currently displayed product in .product0 is the relevant one
  const productContainer = document.querySelector(".product0");
  if (!productContainer) return;

  const likeButton = productContainer.querySelector(
    ".like-button[data-product-id]"
  );
  const dislikeButton = productContainer.querySelector(
    ".dislike-button[data-product-id]"
  );

  if (likeButton) {
    const productId = likeButton.getAttribute("data-product-id");
    const currentVote = votedProducts.find(
      (vp) => String(vp.item_id) === String(productId)
    );
    if (currentVote) {
      updateVoteButtonStyles(productId, currentVote.vote_type);
    } else {
      updateVoteButtonStyles(productId, "none"); // Ensure no style if not voted
    }
  }
  // No need to check dislike button separately, updateVoteButtonStyles handles both
}

/**
 * Sends a downvote request to the backend for a given product ID.
 * Can optionally accept the item type name directly to avoid lookup.
 * @param {string} productId - The ID of the item to downvote.
 * @param {string|null} [itemTypeNameParam=null] - Optional: The type name ('DB Product', etc.) if known.
 */
async function DownvoteProduct(productId, itemTypeNameParam = null) {
  edgeConsole.log(
    `Attempting to downvote product ${productId}${
      itemTypeNameParam ? ` (Type provided: ${itemTypeNameParam})` : ""
    }`
  );

  // 1. Get Auth Token (remains the same)
  const token = localStorage.getItem("authToken");
  if (!token) {
    edgeConsole.error(
      "Downvote failed: User not logged in (no auth token found)."
    );
    console.error("Please log in to vote.");
    document.getElementById("profileBtn")?.click(); // Use optional chaining for safety
    return;
  }

  let determinedItemTypeName = itemTypeNameParam; // Use provided type name if available

  // 2. Determine Item Type Name IF NOT PROVIDED
  if (!determinedItemTypeName) {
    // Fallback to looking in the main 'products' list
    const product = products.find((p) => String(p.id) === String(productId)); // Compare as strings
    if (!product) {
      // This can still happen if called without type from somewhere else
      // and the product isn't in the main list.
      edgeConsole.error(
        `Downvote failed: Product data not found in 'products' array for ID ${productId} and type was not provided.`
      );
      // Consider if we should check 'votedProducts' as a fallback? Maybe not needed.
      return;
    }
    determinedItemTypeName = getItemTypeName(product); // Get type from product data
  }

  // 3. Check if Type Name is Valid
  if (!determinedItemTypeName) {
    edgeConsole.error(
      `Downvote failed: Could not determine item type name for product ${productId}.`
    );
    return;
  }

  // Trigger UI update for vote buttons globally
  updateVoteButtonStyles(productId, "downvote"); // Pass numeric vote type

  // 4. Prepare API Request Payload (using determinedItemTypeName)
  const payload = {
    itemId: productId,
    itemTypeName: determinedItemTypeName, // Use the determined type
  };

  // 5. Send Fetch Request (remains the same)
  try {
    const response = await fetch(DOWNVOTE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // 6. Handle Response (Update local list and styles)
    if (response.ok) {
      edgeConsole.log(
        `Successfully downvoted product ${productId} (Type: ${determinedItemTypeName})`
      );

      // Update local votedProducts list (convert ID to string for reliable findIndex)
      const productIdStr = String(productId);
      const existingVoteIndex = votedProducts.findIndex(
        (vp) => String(vp.item_id) === productIdStr
      );
      const now = new Date().toISOString();

      if (existingVoteIndex !== -1) {
        // If it was in the list (as upvote or downvote), update/remove it
        // Since this is Downvote, we mark it or potentially remove if UX dictates
        votedProducts[existingVoteIndex].vote_type = -1; // Assuming -1 for downvote now
        votedProducts[existingVoteIndex].voted_at = now;
        edgeConsole.log(
          `Updated local vote status for ${productId} to downvote (-1).`
        );
      } else {
        // If it wasn't in the list, maybe add it as downvoted?
        // This depends on whether 'votedProducts' should track downvotes too.
        // Let's assume for now we only update existing ones or remove them on downvote.
        edgeConsole.log(
          `Product ${productId} not found in local voted list to update after downvote.`
        );
      }
    } else {
      const errorData = await response.json().catch(() => response.text()); // Handle non-JSON errors too
      edgeConsole.error(
        `Downvote API call failed for ${productId}: ${response.status}`,
        errorData
      );
    }
  } catch (error) {
    edgeConsole.error(
      `Network or other error sending downvote for ${productId}:`,
      error
    );
  }
}

// initializeWebSocket();
// getCachedProducts();

// setInterval(UpdateFaces, 1000);

/**
 * Gets the item type name string based on the numeric item_type_id.
 * Used for providing the correct type name when removing favorites.
 * @param {number | string} typeId - The numeric ID (e.g., 1, 4).
 * @returns {string | null} The corresponding name ('DB Product', 'Viator Ticket', etc.) or null.
 */
function getItemTypeNameFromId(typeId) {
  // Ensure these IDs and names match your backend configuration and getItemTypeName function
  // Convert typeId to number for reliable comparison
  switch (Number(typeId)) {
    case 1:
      return "DB Product";
    case 4:
      return "Viator Ticket"; // IMPORTANT: Verify '4' is the correct ID for Viator Tickets
    // Add cases for 'DB Ticket', 'Deal', etc. if they can be favorited via other means
    // case 2: return 'DB Ticket';
    // case 3: return 'Deal';
    default:
      edgeConsole.warn(
        `Cannot determine item type name from unknown item_type_id: ${typeId}`
      );
      // Fallback carefully - maybe return null and handle it in DownvoteProduct?
      // Or return a default if appropriate? Returning null is safer.
      return null;
  }
}

/**
 * Populates the Favorites tab UI based on the 'votedProducts' array.
 * Clears existing items and clones a template for each upvoted product.
 */
function populateFavoritesTab() {
  const favsContainer = document.getElementById("favs");
  const template = favsContainer?.querySelector(".fav-item.none"); // Use optional chaining

  if (!favsContainer || !template) {
    console.error(
      "Favorites container (#favs) or template (.fav-item.none) not found."
    );
    return;
  }

  console.log("Populating favorites tab...");

  // Clear existing *visible* favorite items (leave the template)
  favsContainer
    .querySelectorAll(".fav-item:not(.none)")
    .forEach((item) => item.remove());

  // Filter for upvoted items and sort by vote time descending (most recent first)
  const upvotedItems = votedProducts
    .filter((item) => item.vote_type === 1)
    .sort((a, b) => new Date(b.voted_at) - new Date(a.voted_at));

  if (upvotedItems.length === 0) {
    console.log("No favorited items to display.");
    // Optional: Display a message like "You haven't favorited any items yet."
    // You could clone the template, change text, and display it.
    return;
  }

  upvotedItems.forEach((votedProduct) => {
    const newItem = template.cloneNode(true); // Deep clone the template
    newItem.classList.remove("none"); // Make it potentially visible
    newItem.style.display = "flex"; // Set display style specifically to flex

    // Store item ID for potential removal
    newItem.setAttribute("data-item-id", votedProduct.item_id);

    // Populate content
    const link = newItem.querySelector(".fav-item-link");
    const img = newItem.querySelector(".fav-img");
    const heading = newItem.querySelector(".fav-h");
    const removeButtonDiv = newItem.querySelector(".fav-remove"); // Target the div containing the SVG

    if (link) {
      link.href = votedProduct.affiliate_link || "#"; // Use link, fallback to #
      // Add click tracking if desired for favorites list clicks
      link.addEventListener("click", () => {
        // Find the corresponding product data if needed for trackClick
        // This might require looking up the full product details again
        // based on votedProduct.item_id if trackClick needs more than the favorite entry has.
        // For now, we'll skip detailed tracking here unless required.
        console.log(`Clicked favorite item link: ${votedProduct.item_id}`);
      });
    }
    if (img) {
      img.src =
        votedProduct.image_link ||
        "https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg"; // Use image, fallback placeholder
      img.alt = votedProduct.name || "Favorited item"; // Use name for alt text
      img.loading = "lazy"; // Good practice
    }
    if (heading) {
      heading.textContent = votedProduct.name || "Unnamed Item"; // Use name
    }

    // Add remove functionality
    if (removeButtonDiv) {
      removeButtonDiv.style.cursor = "pointer"; // Indicate it's clickable
      removeButtonDiv.setAttribute("title", "Remove from favorites"); // Tooltip
      removeButtonDiv.onclick = (event) => {
        event.preventDefault(); // Prevent link navigation if the remove button is inside the <a>
        event.stopPropagation(); // Stop click from bubbling further
        const itemIdToRemove = newItem.getAttribute("data-item-id");
        console.log(`Attempting to remove favorite: ${itemIdToRemove}`);

        const itemTypeName = getItemTypeNameFromId(votedProduct.item_type_id); // Use the helper

        // Call DownvoteProduct to update backend and local list
        // DownvoteProduct already handles the local votedProducts array update
        DownvoteProduct(itemIdToRemove, itemTypeName)
          .then(() => {
            // Remove the item from the DOM immediately after initiating downvote
            // Or wait for success if preferred, but immediate removal feels better UX
            newItem.remove();
            console.log(`Removed favorite item ${itemIdToRemove} from UI.`);
            // Optionally, re-check if the list is now empty and show a message
            if (
              favsContainer.querySelectorAll(".fav-item:not(.none)").length ===
              0
            ) {
              console.log("Favorites list is now empty.");
              // Display empty message if needed
            }
          })
          .catch((err) => {
            console.error(`Failed to remove favorite ${itemIdToRemove}:`, err);
            // Optionally inform the user about the failure
          });
      };
    }

    // Append the new populated item to the container
    favsContainer.appendChild(newItem);
  });

  console.log(`Added ${upvotedItems.length} items to the favorites tab.`);
}


// --- NEW: Main Initialization Function ---
function initializeApp() {
  edgeConsole.log("DOM ready, initializing application..."); // Log initialization start

  // Start WebSocket connection
  initializeWebSocket();

  // Fetch initial product data
  getCachedProducts();

  // Start the interval timer for updating faces
  // Ensure UpdateFaces itself handles null elements gracefully if called before elements exist
  setInterval(UpdateFaces, 1000);

  // Set up the login/auth related UI and logic
  setupLoginHandling(fetchVotedProducts, populateFavoritesTab);

  // Any other initialization code that depends on the DOM should go here
  hideConsoleMessages(); // Call this after DOM ready if it depends on anything
}

export function startScreen() {
  initializeApp();
}

export { UpdateProductViaDataRole };
