// Add this to your AuthContext.jsx to automatically handle token exchange

// In your fetchUser function, after successful Google authentication:
const enhancedFetchUser = useCallback(
  async (token) => {
    try {
      const res = await fetch(USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      setUser({
        name: data.name || data.email,
        email: data.email,
        avatarSeed: encodeURIComponent(data.name || data.email),
      });

      // Exchange token for backend-compatible token
      try {
        const backendToken = await authTokenService.getBackendToken(token);
        console.log("Backend token acquired for API calls");
      } catch (exchangeError) {
        console.warn(
          "Backend token exchange failed, using original token:",
          exchangeError
        );
      }

      // Dispatch event to notify other components that user has logged in
      window.dispatchEvent(
        new CustomEvent("auth-user-authenticated", {
          detail: { user: data, token },
        })
      );
    } catch (err) {
      console.error("Auth fetch failed:", err);
      logout();
    } finally {
      setIsAuthLoading(false);
    }
  },
  [USERINFO_URL]
);
