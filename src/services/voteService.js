// src/services/voteService.js
const BASE = "https://fastapi.edgevideo.ai/tracking";
const UPVOTE_URL = `${BASE}/vote/up`;
const DOWNVOTE_URL = `${BASE}/vote/down`;

function normalizeItemTypeName(name) {
  if (!name) return "DB Product";
  const n = String(name).trim().toLowerCase();
  if (n === "product" || n === "db product" || n === "db_product")
    return "DB Product";
  if (n === "ticket" || n === "db ticket" || n === "db_ticket")
    return "DB Ticket";
  if (n === "viator" || n === "viator ticket" || n === "viator_ticket")
    return "Viator Ticket";
  if (n === "deal") return "Deal";
  return name;
}

async function postVote(url, itemId, itemTypeName) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("No auth token");
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
    throw new Error(`Vote failed: ${res.status} ${err}`);
  }
}

export function upvoteProduct(itemId, itemTypeName) {
  return postVote(UPVOTE_URL, itemId, itemTypeName);
}

export function downvoteProduct(itemId, itemTypeName) {
  return postVote(DOWNVOTE_URL, itemId, itemTypeName);
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

export function updateVoteButtonStyles(productId, voteType) {
  const likeButtons = document.querySelectorAll(
    `.like-button[data-product-id="${productId}"]`
  );
  const dislikeButtons = document.querySelectorAll(
    `.dislike-button[data-product-id="${productId}"]`
  );

  if (likeButtons.length === 0 && dislikeButtons.length === 0) {
    console.log(
      `No vote buttons found anywhere on the page for product ID ${productId}.`
    );
    return;
  }

  let actionTaken = false;

  likeButtons.forEach((button) => {
    button.classList.remove("clicked");
    if (voteType === "upvote") {
      button.classList.add("clicked");
      actionTaken = true;
    }
  });

  dislikeButtons.forEach((button) => {
    button.classList.remove("clicked");
    if (voteType === "downvote") {
      button.classList.add("clicked");
      actionTaken = true;
    }
  });

  if (actionTaken) {
    if (voteType === "upvote") {
      console.log(`Applied 'clicked' style to like button(s) for ${productId}`);
    } else if (voteType === "downvote") {
      console.log(
        `Applied 'clicked' style to dislike button(s) for ${productId}`
      );
    }
  } else if (
    voteType === "none" &&
    (likeButtons.length > 0 || dislikeButtons.length > 0)
  ) {
    console.log(
      `Removed 'clicked' style from vote buttons for ${productId}`
    );
  }
}

