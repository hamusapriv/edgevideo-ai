import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import { getItemTypeNameFromId } from "../legacy/modules/voteModule";

const VOTES_PRODUCTS = "https://fastapi.edgevideo.ai/tracking/votes/products";
const VOTES_VIATOR = "https://fastapi.edgevideo.ai/tracking/votes/viator";
const DOWNVOTE_URL = "https://fastapi.edgevideo.ai/tracking/vote/down";

const FavoritesContext = createContext({
  favorites: [],
  // votes include upvotes and downvotes for quick lookups
  votes: [],
  removeFavorite: async () => {},
  fetchFavorites: async () => {},
});

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [votes, setVotes] = useState([]);

  // 1️⃣ fetch & annotate on login or refresh
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setVotes([]);
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const opts = { headers: { Authorization: `Bearer ${token}` } };
      const [r1, r2] = await Promise.all([
        fetch(VOTES_PRODUCTS, opts),
        fetch(VOTES_VIATOR, opts),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Failed to fetch votes");
      const [a1, a2] = await Promise.all([r1.json(), r2.json()]);

      const combined = [...a1, ...a2].map((v) => ({
        ...v,
        itemTypeName: getItemTypeNameFromId(v.item_type_id),
      }));

      setVotes(combined);
      setFavorites(combined.filter((v) => v.vote_type === 1));
    } catch (e) {
      console.error("Error loading favorites:", e);
      setFavorites([]);
      setVotes([]);
    }
  }, [user]);

  // run on mount & whenever `user` changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // 2️⃣ downvote + remove locally
  async function removeFavorite(itemId, itemTypeName) {
    const token = localStorage.getItem("authToken");
    await fetch(DOWNVOTE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId, itemTypeName }),
    });
    setFavorites((f) => f.filter((v) => String(v.item_id) !== String(itemId)));
    setVotes((v) =>
      v.map((entry) =>
        String(entry.item_id) === String(itemId)
          ? { ...entry, vote_type: -1 }
          : entry
      )
    );
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, votes, removeFavorite, fetchFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => {
  return useContext(FavoritesContext);
};
