// src/services/voteService.js
import { VOTE_TRACKING_BASE_URL } from "../config/api";
const UPVOTE_URL = `${VOTE_TRACKING_BASE_URL}/vote/up`;
const DOWNVOTE_URL = `${VOTE_TRACKING_BASE_URL}/vote/down`;

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

