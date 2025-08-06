// src/services/voteService.js
const BASE = "https://fastapi.edgevideo.ai/tracking";
const UPVOTE_URL = `${BASE}/vote/up`;
const DOWNVOTE_URL = `${BASE}/vote/down`;

// Debounce and retry configuration
const DEBOUNCE_DELAY = 300; // 300ms debounce
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second between retries

// Store pending votes to avoid duplicates
const pendingVotes = new Map();
const debounceTimers = new Map();

function normalizeItemTypeName(name) {
  if (!name) return "DB Product";
  const n = String(name)
    .trim()
    .toLowerCase();
  if (n === "product" || n === "db product" || n === "db_product")
    return "DB Product";
  if (n === "ticket" || n === "db ticket" || n === "db_ticket")
    return "DB Ticket";
  if (n === "viator" || n === "viator ticket" || n === "viator_ticket")
    return "Viator Ticket";
  if (n === "deal") return "Deal";
  return name;
}

async function postVoteWithRetry(url, itemId, itemTypeName, retryCount = 0) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("No auth token");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemId,
        itemTypeName: normalizeItemTypeName(itemTypeName),
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);

      // If it's a server error (5xx) and we haven't exceeded retries, try again
      if (res.status >= 500 && retryCount < MAX_RETRIES) {
        console.warn(
          `Vote failed with ${res.status}, retrying... (${retryCount +
            1}/${MAX_RETRIES})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (retryCount + 1))
        );
        return postVoteWithRetry(url, itemId, itemTypeName, retryCount + 1);
      }

      throw new Error(`Vote failed: ${res.status} ${err}`);
    }

    return res;
  } catch (error) {
    // Network errors - retry if we haven't exceeded max retries
    if (
      retryCount < MAX_RETRIES &&
      (error.name === "TypeError" || error.message.includes("fetch"))
    ) {
      console.warn(
        `Network error, retrying... (${retryCount + 1}/${MAX_RETRIES}):`,
        error.message
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * (retryCount + 1))
      );
      return postVoteWithRetry(url, itemId, itemTypeName, retryCount + 1);
    }
    throw error;
  }
}

async function postVote(url, itemId, itemTypeName) {
  return postVoteWithRetry(url, itemId, itemTypeName);
}

function createDebouncedVote(voteFunction) {
  return (itemId, itemTypeName) => {
    const voteKey = `${itemId}-${itemTypeName}`;

    // Clear existing timer for this vote
    if (debounceTimers.has(voteKey)) {
      clearTimeout(debounceTimers.get(voteKey));
    }

    // If there's already a pending vote for this item, return that promise
    if (pendingVotes.has(voteKey)) {
      return pendingVotes.get(voteKey);
    }

    // Create a promise that will resolve after debounce delay
    const votePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          // Remove from pending votes when starting the actual request
          pendingVotes.delete(voteKey);
          debounceTimers.delete(voteKey);

          const result = await voteFunction(itemId, itemTypeName);
          resolve(result);
        } catch (error) {
          console.error("Vote error:", error);
          reject(error);
        }
      }, DEBOUNCE_DELAY);

      debounceTimers.set(voteKey, timer);
    });

    // Store the promise so duplicate requests can use the same one
    pendingVotes.set(voteKey, votePromise);

    return votePromise;
  };
}

// Create debounced versions of vote functions
const debouncedUpvote = createDebouncedVote((itemId, itemTypeName) =>
  postVote(UPVOTE_URL, itemId, itemTypeName)
);

const debouncedDownvote = createDebouncedVote((itemId, itemTypeName) =>
  postVote(DOWNVOTE_URL, itemId, itemTypeName)
);

export function upvoteProduct(itemId, itemTypeName) {
  return debouncedUpvote(itemId, itemTypeName);
}

export function downvoteProduct(itemId, itemTypeName) {
  return debouncedDownvote(itemId, itemTypeName);
}

export function getItemTypeNameFromId(typeId) {
  switch (Number(typeId)) {
    case 1:
      return "DB Product";
    case 2:
      return "DB Ticket";
    case 3:
      return "Deal";
    case 4:
      return "Viator Ticket";
    default:
      return null;
  }
}
