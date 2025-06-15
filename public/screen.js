// Inject channelId into window for any non-React scripts
(function () {
  const params = new URLSearchParams(window.location.search);
  let channelId =
    params.get("channelId") ||
    localStorage.getItem("channelId") ||
    "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";
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

let edgeConsole = {
  log: (...args) => window.console.log(...args),
  info: (...args) => window.console.info(...args),
  error: (...args) => window.console.error(...args),
  // add warn, debug, etc.
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

let products = [];
let downvotedIds = [];
let productDataQueue = [];
let faceDataQueue = [];

let productsPaused = false;
let productProcessTimeout = null;

function PauseProducts() {
  productsPaused = true;
}

function UnpauseProducts() {
  productsPaused = false;
}

function SetShoppingAIStatus(messageText) {
  let elm = document.getElementById("aiStatusTextShopping");

  if (elm != null) {
    elm.innerText = messageText;
  }
}

function UpdateFaces() {
  let faceData = null;

  if (faceDataQueue.length > 0) {
    faceData = faceDataQueue.shift();
  } else {
    return;
  }

  let faceDivs = document.querySelectorAll("div.face");

  let matchedFaceDiv = null;
  let oldestFaceDiv = null;
  // let oldestTime = Infinity;

  // Loop through all faceDivs to find a match or identify the oldest one
  let startTime = 100;
  for (let faceDiv of faceDivs) {
    startTime -= 1;

    const faceId = faceDiv.getAttribute("data-id");

    if (faceId == faceData.id) {
      edgeConsole.log("Duplicate face ID");
      return;
    }
  }

  // for https://github.com/EdgeCTO/DevWork/issues/106
  oldestFaceDiv = document.querySelector(".face0");

  let targetFaceDiv;

  if (matchedFaceDiv) {
    // If a matching faceDiv is found, use it
    targetFaceDiv = matchedFaceDiv;
  } else {
    // Otherwise, use the oldest faceDiv
    targetFaceDiv = oldestFaceDiv;
  }

  try {
    // script is being used somewhere else...
    if (targetFaceDiv == null) return;

    // Update the data-id and data-time attributes
    targetFaceDiv.setAttribute("data-id", faceData.id);
    targetFaceDiv.setAttribute("data-time", Date.now());

    // Update the content of the target faceDiv
    const nameElement = targetFaceDiv.querySelector("p.face-name");
    if (nameElement) {
      nameElement.innerText = faceData.name;
    }

    const fameElement = targetFaceDiv.querySelector("p.face-fame");
    if (fameElement) {
      if (faceData.accomplishments !== "{}") {
        fameElement.innerText = faceData.accomplishments;
      } else {
        fameElement.innerText = "";
      }
    }

    const dobElement = targetFaceDiv.querySelector("p.face-dob");
    if (dobElement) {
      const dob = new Date(faceData.dob);
      const formattedDOB = `${
        dob.getMonth() + 1
      }/${dob.getDate()}/${dob.getFullYear()}`;
      dobElement.innerText = formattedDOB;
    }

    const imageElement = targetFaceDiv.querySelector("img.face-image");
    if (imageElement) {
      imageElement.src = faceData.image_url;
      imageElement.srcset = "";
    }

    // Update social links if they exist
    const socialsLinks = targetFaceDiv.querySelectorAll(
      "div.socials-links p.socials-link"
    );
    socialsLinks.forEach((linkElement, index) => {
      if (linkElement && index < 3) {
        linkElement.innerHTML = "";
      }
    });

    const socialUrls = {
      twitter_url: faceData.twitter_url
        ? `<a href="${faceData.twitter_url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <circle cx="12" cy="12" r="12" fill="black"/> <path d="M15.15 17.4L6.30005 6.59998H8.70005L17.55 17.4H15.75H15.15Z" stroke="white"/> <path d="M17.6999 6L12.8999 11.55L12.5999 11.1L12.1499 10.65L16.1999 6H17.6999Z" fill="white"/> <path d="M11.55 13.05L7.35 17.7H6L11.2248 11.7L10.8344 12.15L11.55 13.05Z" fill="white"/> </svg></a>`
        : "",
      facebook_url: faceData.facebook_url
        ? `<a href="${faceData.facebook_url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <circle cx="12" cy="12" r="12" fill="black"/> <path d="M14.9155 8.72727V10.4176H9.43397V8.72727H14.9155ZM10.8044 18V7.85192C10.8044 7.2281 10.9331 6.70892 11.1907 6.29439C11.4523 5.87985 11.8025 5.56996 12.2411 5.3647C12.6798 5.15945 13.1668 5.05682 13.7021 5.05682C14.0804 5.05682 14.4164 5.087 14.7102 5.14737C15.004 5.20774 15.2214 5.26207 15.3622 5.31037L14.9276 7.00071C14.835 6.97254 14.7183 6.94436 14.5774 6.91619C14.4366 6.884 14.2796 6.8679 14.1066 6.8679C13.7001 6.8679 13.4123 6.9665 13.2433 7.16371C13.0783 7.35689 12.9958 7.63459 12.9958 7.9968V18H10.8044Z" fill="white"/> </svg></a>`
        : "",
      instagram_url: faceData.instagram_url
        ? `<a href="${faceData.instagram_url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <circle cx="12" cy="12" r="12" fill="black"/> <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" stroke="white"/> <circle cx="12" cy="12" r="2.5" stroke="white"/> <circle cx="15.1499" cy="8.84998" r="0.75" fill="white"/> </svg></a>`
        : "",
    };

    let validSocialLinks = 0;
    socialsLinks.forEach((linkElement, index) => {
      if (linkElement && index < 3) {
        const socialKey = Object.keys(socialUrls)[index];
        linkElement.innerHTML = socialUrls[socialKey];
        if (socialUrls[socialKey] != "") validSocialLinks++;
      }
    });

    if (validSocialLinks == 0) {
      targetFaceDiv.querySelector("div.face-socials").style.display = "none";
    } else {
      targetFaceDiv.querySelector("div.face-socials").style.display = "block";
    }

    // Move the target faceDiv to the top (make it the first child of its parent)
    targetFaceDiv.parentElement.insertBefore(
      targetFaceDiv,
      targetFaceDiv.parentElement.firstChild
    );
  } catch (error) {
    edgeConsole.error("Error updating face data:", error);
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

function addToFaceDataQueue(newFaceData) {
  // Check if an element with the same id already exists
  const exists = faceDataQueue.some((face) => face.id === newFaceData.id);

  // If not, push the new data into the array
  if (!exists) {
    faceDataQueue.push(newFaceData);

    // Keep only the 10 most recent items
    if (faceDataQueue.length > 10) {
      faceDataQueue.shift(); // Remove the oldest item
    }
  }
}

function addToProductDataQueue(data) {
  edgeConsole.log(data);

  const exists = productDataQueue.some((product) => product.id === data.id);

  if (!exists) {
    productDataQueue.push(data);

    // Keep only the 10 most recent items
    if (productDataQueue.length > 10) {
      productDataQueue.shift(); // Remove the oldest item
    }
  }
}

function processProductDataQueue() {
  if (productProcessTimeout != null) {
    clearTimeout(productProcessTimeout);
    productProcessTimeout = null;
  }

  if (productDataQueue.length > 0 && !productsPaused) {
    let data = productDataQueue.shift();

    // add a time to this product
    data.time = Date.now();

    const existingIndex = products.findIndex(
      (product) => product.id === data.id
    );

    if (existingIndex !== -1) {
      // product exists, skip it
    } else {
      // it's a new product
      products.push(data);

      // stick to 10 products in our array
      if (products.length > 10) products.shift();

      UpdateProductViaDataRole(products.length - 1);

      if (typeof flashShopping === "function") {
        flashShopping();
      }
    }
  }

  if (productDataQueue.length > 0) {
    productProcessTimeout = setTimeout(processProductDataQueue, 1000);
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

function FormatTicketDateTime(product) {
  let formattedDateTime;

  // Check if product.date is an object with separate date and time fields
  if (
    typeof product.date === "object" &&
    product.date.hasOwnProperty("date") &&
    product.date.hasOwnProperty("time")
  ) {
    const { date, time } = product.date;
    formattedDateTime = new Date(`${date}T${time}`).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  }
  // Check if product.date is an ISO string
  else if (
    typeof product.date === "string" &&
    !isNaN(Date.parse(product.date))
  ) {
    formattedDateTime = new Date(product.date).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } else {
    // Handle invalid formats
    return "";
  }

  return formattedDateTime;
}

function FormatPrice(price, currency = "USD") {
  price = parseFloat(price);

  // Currency format mapping
  const currencyFormats = {
    USD: { symbol: "$", position: "prefix" },
    US$: { symbol: "$", position: "prefix" },
    $: { symbol: "$", position: "prefix" },
    GBP: { symbol: "Â£", position: "prefix" },
    "Â£": { symbol: "Â£", position: "prefix" },
    EUR: { symbol: "â‚¬", position: "postfix" },
    "â‚¬": { symbol: "â‚¬", position: "postfix" },
    JPY: { symbol: "Â¥", position: "prefix" },
    "Â¥": { symbol: "Â¥", position: "prefix" },
    CAD: { symbol: "C$", position: "prefix" },
    C$: { symbol: "C$", position: "prefix" },
    AUD: { symbol: "A$", position: "prefix" },
    A$: { symbol: "A$", position: "prefix" },
    INR: { symbol: "â‚¹", position: "prefix" },
    "â‚¹": { symbol: "â‚¹", position: "prefix" },
    CNY: { symbol: "Â¥", position: "prefix" },
    "CNÂ¥": { symbol: "Â¥", position: "prefix" },
    CHF: { symbol: "CHF", position: "postfix" },
    RUB: { symbol: "â‚½", position: "postfix" },
    "â‚½": { symbol: "â‚½", position: "postfix" },
    // Add more currencies as needed
  };

  // Normalize the currency input
  currency = currency.toUpperCase();

  // Set the symbol and position based on the currency
  let symbol = "";
  let position = "prefix";
  if (currencyFormats.hasOwnProperty(currency)) {
    symbol = currencyFormats[currency].symbol;
    position = currencyFormats[currency].position;
  } else {
    // Default to using the currency code as the postfix symbol
    symbol = currency;
    position = "postfix";
  }

  // Format the price with commas and appropriate decimal places
  let formattedPrice;
  if (price % 1 === 0) {
    // Price is an integer
    formattedPrice = price.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  } else {
    // Price has decimals
    formattedPrice = price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Construct the final formatted price string
  let formattedPriceString;
  if (position === "prefix") {
    formattedPriceString = `${symbol}${formattedPrice}`;
  } else {
    formattedPriceString = `${formattedPrice}${symbol}`;
  }

  return formattedPriceString;
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
  let shareButtons = itemContainer.querySelectorAll('[data-role="share-link"]');
  let explanations = itemContainer.querySelectorAll(
    '[data-role="ai-description"]'
  );
  let vendorImages = itemContainer.querySelectorAll(
    '[data-role="vendor-logo"]'
  );
  let likeButtons = itemContainer.querySelectorAll('[data-role="like"]');
  let dislikeButtons = itemContainer.querySelectorAll('[data-role="dislike"]');
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

    // Hook up the like buttons
    likeButtons.forEach((likeButton) => {
      likeButton.setAttribute("data-product-id", product.id); // Add product ID attribute
      likeButton.onclick = null;
      likeButton.onclick = function (event) {
        UpvoteProduct(this.getAttribute("data-product-id")); // Get ID from attribute
        event.stopPropagation();
      };
      // Remove any 'voted' class initially
      // likeButton.classList.remove('voted');
    });

    // Hook up the dislike buttons
    dislikeButtons.forEach((dislikeButton) => {
      dislikeButton.setAttribute("data-product-id", product.id); // Add product ID attribute
      dislikeButton.onclick = null;
      dislikeButton.onclick = function (event) {
        DownvoteProduct(this.getAttribute("data-product-id")); // Get ID from attribute
        event.stopPropagation();
      };
      // Remove any 'voted' class initially
      // dislikeButton.classList.remove('voted');
    });

    // Update share buttons (existing logic)
    shareButtons.forEach((shareButton) => {
      if (navigator.share) {
        shareButton.style.display = ""; // Ensure it's visible
        // Remove previous handler before adding new one
        shareButton.onclick = null; // Simple way for inline handlers
        shareButton.onclick = function (event) {
          navigator
            .share({
              title: product.title,
              text: `Check out this product: ${product.title}`,
              url: product.link,
            })
            .then(() => edgeConsole.log("Successful share"))
            .catch((error) => edgeConsole.log("Error sharing:", error));
          event.stopPropagation();
        };
      } else {
        shareButton.style.display = "none";
      }
    });
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

/**
 * Sends an upvote request to the backend for a given product ID.
 * @param {string} productId - The ID of the item to upvote.
 */
async function UpvoteProduct(productId) {
  edgeConsole.log(`Attempting to upvote product ${productId}`);

  // 1. Get Auth Token
  const token = localStorage.getItem("authToken");
  if (!token) {
    edgeConsole.error(
      "Upvote failed: User not logged in (no auth token found)."
    );
    // Optionally: Prompt user to login
    console.error("Please log in to vote."); // Simple feedback
    document.getElementById("profileBtn").click(); // Switch to Profile tab
    return;
  }

  // 2. Find Product Data to get Type Name
  const product = products.find((p) => p.id === productId);
  if (!product) {
    edgeConsole.error(
      `Upvote failed: Product data not found for ID ${productId}`
    );
    return;
  }

  // 3. Determine Item Type Name
  const itemTypeName = getItemTypeName(product);
  if (!itemTypeName) {
    edgeConsole.error(
      `Upvote failed: Could not determine item type name for product ${productId}`
    );
    // Optionally provide user feedback about data inconsistency
    return;
  }

  // *** Trigger UI update for vote buttons ***
  updateVoteButtonStyles(productId, "upvote");

  // 4. Prepare API Request Payload
  const payload = {
    itemId: productId,
    itemTypeName: itemTypeName,
  };

  // 5. Send Fetch Request
  try {
    const response = await fetch(UPVOTE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // 6. Handle Response
    if (response.ok) {
      edgeConsole.log(
        `Successfully upvoted product ${productId} (Type: ${itemTypeName})`
      );

      const existingVoteIndex = votedProducts.findIndex(
        (vp) => String(vp.item_id) === String(productId)
      );
      const now = new Date().toISOString();

      if (existingVoteIndex !== -1) {
        // Already in the list, update its type and time
        votedProducts[existingVoteIndex].vote_type = 1;
        votedProducts[existingVoteIndex].voted_at = now;
        edgeConsole.log(
          `Updated local vote status for ${productId} to upvote.`
        );
      } else {
        // Not in the list, add it (ensure necessary fields are present)
        votedProducts.push({
          item_id: String(productId), // Ensure consistent type (string)
          vote_type: 1,
          voted_at: now,
          item_type_id:
            product.type === "ticket" ? 2 : product.type === "deal" ? 3 : 1, // Map type to ID (adjust if needed)
          name: product.title || product.name, // Use appropriate name field
          affiliate_link: product.link,
          image_link: product.image,
        });
        edgeConsole.log(`Added ${productId} to local voted list as upvoted.`);
      }
    } else {
      const errorData = await response.json(); // Try to get error message from backend
      edgeConsole.error(
        `Upvote API call failed for ${productId}: ${response.status}`,
        errorData
      );
    }
  } catch (error) {
    edgeConsole.error(
      `Network or other error sending upvote for ${productId}:`,
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

// This bit handles logging in
function setupLoginHandling() {
  // --- Configuration ---
  const backendBaseUrl = "https://fastapi.edgevideo.ai";
  const authRouteBase = `${backendBaseUrl}/auth_google`;
  const userInfoUrl = `${authRouteBase}/details`; // URL to get user details
  const frontendUrl = window.location.origin + window.location.pathname; // URL for redirect

  // --- UI Element Selection (New Page Structure) ---
  // Use querySelector as ID wasn't provided and it might be the only one
  const signInButton = document.querySelector("button.gsi-material-button");
  const logoutDiv = document.getElementById("logout"); // The logout 'button' is now a div
  const usernameElements = document.querySelectorAll(".username"); // All elements to show the username
  const avatarContainers = document.querySelectorAll(".avatar-container");
  const avatarImages = document.querySelectorAll(".avatar"); // All avatar image elements
  const errorMessageP = document.getElementById("errorMessage"); // Optional: For displaying errors
  const favoritesButton = document.getElementById("favoritesBtn");

  // --- Function to Fetch User Details (Mostly unchanged from original) ---
  async function fetchUserDetails(token) {
    if (errorMessageP) errorMessageP.textContent = ""; // Clear previous errors
    try {
      const response = await fetch(userInfoUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Send the JWT
        },
      });

      if (response.status === 401) {
        console.error("Token is invalid or expired.");
        localStorage.removeItem("authToken");
        let errorJson = null;
        try {
          errorJson = await response.json();
        } catch (e) {
          /* ignore */
        }
        const message =
          errorJson?.message || "Session invalid. Please log in again.";
        throw new Error(message);
      }
      if (!response.ok) {
        let errorJson = null;
        try {
          errorJson = await response.json();
        } catch (e) {
          /* ignore */
        }
        const message =
          errorJson?.message ||
          `Failed to fetch user details (Status: ${response.status})`;
        throw new Error(message);
      }

      const userData = await response.json();
      // Use name, fallback to email, fallback to 'User'
      const displayName = userData.name || userData.email || "User";
      // Return all data plus the derived displayName
      return { ...userData, displayName };
    } catch (error) {
      console.error("Error fetching user details:", error);
      if (errorMessageP) {
        errorMessageP.textContent =
          error.message || "Could not retrieve user information.";
      }
      showLoggedOutState(); // Log out UI on fetch failure
      return null;
    }
  }

  // --- UI Update Functions (Adapted for New Page Structure) ---
  async function showLoggedInState(currentToken) {
    const user = await fetchUserDetails(currentToken);

    if (user) {
      // 1. Hide Sign-In Button
      if (signInButton) {
        signInButton.style.display = "none";
      }

      // 2. Show Log Out Div
      if (logoutDiv) {
        logoutDiv.style.display = "flex"; // Or 'flex', 'inline-block' etc. as needed
      }

      // 3. Update Username Elements
      usernameElements.forEach((el) => {
        el.textContent = user.displayName;
      });

      // 4. Update Avatar Images
      const avatarSeed = encodeURIComponent(user.displayName); // Ensure name is URL-safe
      const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;
      avatarImages.forEach((img) => {
        img.src = avatarUrl;
        img.alt = `${user.displayName}'s avatar`; // Good practice for accessibility
        img.style.display = "flex";
      });
      avatarContainers.forEach((div) => {
        div.style.display = "flex";
      });

      // Optional: Clear any residual error messages
      if (errorMessageP) errorMessageP.textContent = "";

      console.log(`Logged in as: ${user.displayName} (${user.email})`);

      await fetchVotedProducts();
    }
    // If fetchUserDetails failed, it already called showLoggedOutState()
  }

  function showLoggedOutState() {
    // 1. Show Sign-In Button
    if (signInButton) {
      // Make sure it's visible. 'block' is a common default. Adjust if needed.
      signInButton.style.display = "flex";
    }

    // 2. Hide Log Out Div
    if (logoutDiv) {
      logoutDiv.style.display = "none";
    }

    // 3. Clear Username Elements
    usernameElements.forEach((el) => {
      el.textContent = ""; // Or set to a default like 'Guest'
    });

    // 4. Reset or set default Avatar Images
    const defaultAvatarUrl =
      "https://api.dicebear.com/9.x/bottts/svg?seed=guest"; // Default avatar
    avatarImages.forEach((img) => {
      img.src = defaultAvatarUrl;
      img.alt = "Default avatar";
    });
    avatarContainers.forEach((div) => {
      div.style.display = "none";
    });

    // Optional: Display logged-out message (don't clear potential important errors)
    // if (errorMessageP && !errorMessageP.textContent) { // Only set if no specific error shown
    //    errorMessageP.textContent = 'You are logged out.';
    // }
    console.log("Showing logged out state.");

    votedProducts = [];
  }

  // --- Event Listeners (Attached to New Elements) ---
  if (signInButton) {
    signInButton.addEventListener("click", () => {
      if (errorMessageP) errorMessageP.textContent = ""; // Clear errors
      // Redirect to Google login endpoint
      const googleLoginUrl = `${authRouteBase}/google?redirectUri=${encodeURIComponent(
        frontendUrl
      )}`;
      window.location.href = googleLoginUrl;
    });
  } else {
    console.warn('Sign in button with class "gsi-material-button" not found.');
  }

  if (logoutDiv) {
    logoutDiv.addEventListener("click", () => {
      if (errorMessageP) errorMessageP.textContent = ""; // Clear errors
      localStorage.removeItem("authToken");
      showLoggedOutState();
    });
    // Add cursor pointer to make the div behave more like a button visually
    logoutDiv.style.cursor = "pointer";
  } else {
    console.warn('Logout div with ID "logout" not found.');
  }

  if (favoritesButton) {
    favoritesButton.addEventListener("click", () => {
      console.log("Favorites button clicked.");
      // Check if logged in before populating? Optional, depends on UX.
      const token = localStorage.getItem("authToken");
      if (token) {
        populateFavoritesTab();
      } else {
        console.log("User not logged in, cannot show favorites.");
        // Optional: Show a message asking the user to log in.
        const favsContainer = document.getElementById("favs");
        if (favsContainer) {
          favsContainer
            .querySelectorAll(".fav-item:not(.none)")
            .forEach((item) => item.remove());
          // Display login message if desired
        }
      }
    });
  } else {
    console.warn("Favorites button with ID 'favoritesBtn' not found.");
  }

  // --- Initial Page Load Logic (Unchanged from original) ---
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  let currentToken = null;

  if (tokenFromUrl) {
    currentToken = tokenFromUrl;
    localStorage.setItem("authToken", currentToken);
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log("Token received from URL, attempting login...");
    showLoggedInState(currentToken); // Update UI based on token
  } else {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      console.log("Token found in localStorage, attempting login...");
      currentToken = storedToken;
      showLoggedInState(currentToken); // Update UI based on stored token
    } else {
      console.log("No token found. Showing logged out state.");
      showLoggedOutState(); // Show initial logged-out state
    }
  }
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
  setupLoginHandling();

  // Any other initialization code that depends on the DOM should go here
  hideConsoleMessages(); // Call this after DOM ready if it depends on anything
}

if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", initializeApp);
  edgeConsole.log("DOM not ready, adding listener.");
} else {
  // `DOMContentLoaded` has already fired
  edgeConsole.log("DOM already ready, initializing immediately.");
  initializeApp();
}
