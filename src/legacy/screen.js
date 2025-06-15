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
import { AddClassToAll, RemoveClassFromAll } from "./modules/utils";

// Channel ID used by legacy code
const DEFAULT_CHANNEL_ID =
  window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";
const params = new URLSearchParams(window.location.search);
const channelId = params.get("channelId") || DEFAULT_CHANNEL_ID;
try {
  localStorage.setItem("channelId", channelId);
} catch {}
window.channelId = channelId;

const wsUrl = "wss://slave-ws-service-342233178764.us-west1.run.app"; // WebSocket server URL

// Basic wrapper around the standard console so legacy code can log
// without relying on a global provided elsewhere. This mirrors the
// definition used in the standalone public script.
let edgeConsole = {
  log: (...args) => window.console.log(...args),
  info: (...args) => window.console.info(...args),
  error: (...args) => window.console.error(...args),
  // add warn, debug, etc. as needed
};



function hideConsoleMessages() {
  if (!window.location.search.toLowerCase().includes("debug")) {
    edgeConsole.log = () => {};
    edgeConsole.info = () => {};
    edgeConsole.error = () => {};
  }
}

// hideConsoleMessages();


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
  let itemContainer = document.querySelector(".product0"); // Assuming this targets the correct container

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

  productImage.onload = function () {
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
        vendorImage.onerror = function () {
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
    } else {
      // Hide price if not available
      prices.forEach((priceDisplay) => {
        priceDisplay.style.display = "none";
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

  productImage.onerror = function () {
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
 * Updates the visual style of ALL like/dislike buttons on the page
 * matching a specific product ID.
 * Assumes buttons have 'like-button' or 'dislike-button' class
 * and a 'data-product-id' attribute matching the productId.
 * @param {string} productId The ID of the product whose buttons to update.
 * @param {'upvote' | 'downvote' | 'none'} voteType The type of vote to reflect.
 */
function updateVoteButtonStyles(productId, voteType) {
  // Find ALL like and dislike buttons matching the productId across the document
  const likeButtons = document.querySelectorAll(
    `.like-button[data-product-id="${productId}"]`
  );
  const dislikeButtons = document.querySelectorAll(
    `.dislike-button[data-product-id="${productId}"]`
  );

  // Check if any buttons were found for this product ID
  if (likeButtons.length === 0 && dislikeButtons.length === 0) {
    // Optional: Log if no buttons are found, might indicate an issue elsewhere
    edgeConsole.log(
      `No vote buttons found anywhere on the page for product ID ${productId}.`
    );
    return; // No buttons found for this ID, nothing to update
  }

  let actionTaken = false; // Flag to help with logging

  // Update all found like buttons
  likeButtons.forEach((button) => {
    // Always remove the class first to handle state changes (e.g., upvote -> none)
    button.classList.remove("clicked");
    if (voteType === "upvote") {
      button.classList.add("clicked");
      actionTaken = true;
    }
  });

  // Update all found dislike buttons
  dislikeButtons.forEach((button) => {
    // Always remove the class first
    button.classList.remove("clicked");
    if (voteType === "downvote") {
      button.classList.add("clicked");
      actionTaken = true;
    }
  });

  // Log the action (consider logging only once if buttons were found)
  if (actionTaken) {
    if (voteType === "upvote") {
      edgeConsole.log(
        `Applied 'clicked' style to like button(s) for ${productId}`
      );
    } else if (voteType === "downvote") {
      edgeConsole.log(
        `Applied 'clicked' style to dislike button(s) for ${productId}`
      );
    }
  } else if (
    voteType === "none" &&
    (likeButtons.length > 0 || dislikeButtons.length > 0)
  ) {
    // Log if we explicitly removed styles because voteType is 'none'
    edgeConsole.log(
      `Removed 'clicked' style from vote buttons for ${productId}`
    );
  }
}

/**
 * Gets the item type name string based on the numeric item_type_id.
 * Used for providing the correct type name when removing favorites.
 * @param {number | string} typeId - The numeric ID (e.g., 1, 4).
// This bit handles logging in
function initializeApp() {
  edgeConsole.log("DOM ready, initializing application..."); // Log initialization start

  // Start WebSocket connection
  initializeWebSocket();

  // Fetch initial product data
  getCachedProducts();

  // Start the interval timer for updating faces
  // Ensure UpdateFaces itself handles null elements gracefully if called before elements exist
  setInterval(UpdateFaces, 1000);


  // Any other initialization code that depends on the DOM should go here
  hideConsoleMessages(); // Call this after DOM ready if it depends on anything
}

export function startScreen() {
  initializeApp();
}

export { UpdateProductViaDataRole };

