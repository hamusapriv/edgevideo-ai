// src/contexts/PointsContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import pointsService from "../services/pointsService";
import { useAuth } from "./AuthContext";
import { useChannelId } from "../hooks/useChannelId";

const PointsContext = createContext({
  points: 0,
  loading: false,
  error: null,
  refreshPoints: () => {},
  formatPoints: (points) => points?.toFixed(0) || "0",
});

export function PointsProvider({ children }) {
  const { user } = useAuth();
  const channelId = useChannelId();

  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update points from service
  const updatePointsState = useCallback((newPoints) => {
    setPoints(newPoints);
    setError(null);
  }, []);

  // Refresh points manually
  const refreshPoints = useCallback(async () => {
    if (!user || !user.email) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await pointsService.updatePoints();
    } catch (err) {
      console.error("Failed to refresh points:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to points service updates
  useEffect(() => {
    pointsService.addListener(updatePointsState);
    return () => {
      pointsService.removeListener(updatePointsState);
    };
  }, [updatePointsState]);

  // Set user email when user is authenticated
  useEffect(() => {
    const userEmail = user?.email || null;
    pointsService.setUserEmail(userEmail);
  }, [user?.email]); // Only trigger when email specifically changes

  // Set channel ID
  useEffect(() => {
    if (channelId) {
      pointsService.setChannelId(channelId);
    }
  }, [channelId]);

  // Initialize WebSocket when user is authenticated and on /app page
  useEffect(() => {
    const isAppPage = window.location.pathname.startsWith("/app");

    if (user && user.email && isAppPage) {
      pointsService.initializeWebSocket();
    } else {
      pointsService.disconnect();
    }

    return () => {
      if (!user) {
        pointsService.reset();
      }
    };
  }, [user]);

  // Reset points when user logs out
  useEffect(() => {
    if (!user) {
      setPoints(0);
      setError(null);
      pointsService.reset();
    }
  }, [user]);

  // Format points for display
  const formatPoints = useCallback(
    (pointsValue = points) => {
      if (typeof pointsValue !== "number") {
        return "0";
      }
      return pointsValue.toFixed(0);
    },
    [points]
  );

  const value = {
    points,
    loading,
    error,
    refreshPoints,
    formatPoints,
  };

  return (
    <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
  );
}

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return context;
};
