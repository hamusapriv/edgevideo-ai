import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import { getItemTypeNameFromId } from "../legacy/modules/voteModule";
import { apiService } from "../services/apiService"; // CONSOLIDATED: Use centralized API service

const FavoritesContext = createContext({
  favorites: [],
  // votes include upvotes and downvotes for quick lookups
  votes: [],
  removeFavorite: async () => {},
  fetchFavorites: async () => {},
  totalFavoritesCount: 0,
  isPulsing: false,
  triggerPulse: () => {},
});

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [votes, setVotes] = useState([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutRef = useRef(null);

  // 1️⃣ fetch & annotate on login or refresh
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setVotes([]);
      return;
    }
    try {
      // CONSOLIDATED: Use centralized API service
      const votedItems = await apiService.fetchVotedProducts();

      const combined = votedItems.map((v) => ({
        ...v,
        itemTypeName: getItemTypeNameFromId(v.item_type_id),
      }));

      setVotes(combined);
      setFavorites(combined.filter((v) => v.vote_type === 1));

      // Don't auto-increment on fetch - only increment when user explicitly likes something
    } catch (e) {
      console.error("Error loading favorites:", e);
      // Don't clear existing data on network errors
    }
  }, [user]);

  // run on mount & whenever `user` changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // 2️⃣ downvote + remove locally with better error handling
  async function removeFavorite(itemId, itemTypeName) {
    if (!user) return;

    // Optimistically update UI first
    const originalFavorites = [...favorites];
    const originalVotes = [...votes];

    setFavorites((f) => f.filter((v) => String(v.item_id) !== String(itemId)));
    setVotes((v) =>
      v.map((entry) =>
        String(entry.item_id) === String(itemId)
          ? { ...entry, vote_type: -1 }
          : entry
      )
    );

    try {
      // CONSOLIDATED: Use centralized API service
      // Find the actual favorite item to get proper itemTypeName
      const favoriteItem = favorites.find(
        (f) => String(f.item_id) === String(itemId)
      );
      const itemTypeNameToUse =
        itemTypeName || favoriteItem?.itemTypeName || "DB Product";

      await apiService.submitVote(itemId, -1, {
        itemTypeName: itemTypeNameToUse,
      });
    } catch (error) {
      console.error("Failed to remove favorite:", error);

      // Revert optimistic updates on failure
      setFavorites(originalFavorites);
      setVotes(originalVotes);

      // Re-throw for component error handling
      throw error;
    }
  }

  // Trigger pulse effect for 2 seconds when product is saved
  const triggerPulse = useCallback(() => {
    // Clear any existing timeout
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }

    // Start pulse
    setIsPulsing(true);

    // Stop pulse after 2 seconds
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 2000);
  }, []);

  // Calculate total favorites count
  const totalFavoritesCount = favorites.length;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        votes,
        removeFavorite,
        fetchFavorites,
        totalFavoritesCount,
        isPulsing,
        triggerPulse,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => {
  return useContext(FavoritesContext);
};
