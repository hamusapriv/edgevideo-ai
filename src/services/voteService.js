// src/services/voteService.js
const BASE = "https://fastapi.edgevideo.ai/tracking";
const UPVOTE_URL = `${BASE}/vote/up`;
const DOWNVOTE_URL = `${BASE}/vote/down`;

async function postVote(url, itemId, itemTypeName) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("No auth token");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itemId, itemTypeName }),
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
