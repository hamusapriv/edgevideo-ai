/* eslint-disable */

let signInButton;
let logoutDiv;
let usernameElements;
let avatarContainers;
let avatarImages;
let errorMessageP;
let favoritesButton;

const backendBaseUrl = "https://fastapi.edgevideo.ai";
const authRouteBase = `${backendBaseUrl}/auth_google`;
const userInfoUrl = `${authRouteBase}/details`;
const frontendUrl = window.location.origin + window.location.pathname;

async function fetchUserDetails(token) {
  if (errorMessageP) errorMessageP.textContent = "";
  try {
    const response = await fetch(userInfoUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.error("Token is invalid or expired.");
      localStorage.removeItem("authToken");
      let errorJson = null;
      try {
        errorJson = await response.json();
      } catch (e) {}
      const message =
        errorJson?.message || "Session invalid. Please log in again.";
      throw new Error(message);
    }
    if (!response.ok) {
      let errorJson = null;
      try {
        errorJson = await response.json();
      } catch (e) {}
      const message =
        errorJson?.message ||
        `Failed to fetch user details (Status: ${response.status})`;
      throw new Error(message);
    }

    const userData = await response.json();
    const displayName = userData.name || userData.email || "User";
    return { ...userData, displayName };
  } catch (error) {
    console.error("Error fetching user details:", error);
    if (errorMessageP) {
      errorMessageP.textContent =
        error.message || "Could not retrieve user information.";
    }
    showLoggedOutState();
    return null;
  }
}

async function showLoggedInState(currentToken, fetchVotedProducts) {
  console.log("[DOM DEBUG] showLoggedInState called");
  const user = await fetchUserDetails(currentToken);

  if (user) {
    console.log("[DOM DEBUG] User found, updating DOM elements");

    // CONSOLIDATED: Dispatch event for React AuthContext to handle state
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth-user-login", {
          detail: {
            user,
            token: currentToken,
          },
        })
      );
    }

    if (signInButton) {
      console.log("[DOM DEBUG] Updating signInButton display");
      if (!signInButton.isConnected) {
        console.warn("[DOM DEBUG] signInButton is not connected to DOM");
        return;
      }
      signInButton.style.display = "none";
    }

    if (logoutDiv) {
      console.log("[DOM DEBUG] Updating logoutDiv display");
      if (!logoutDiv.isConnected) {
        console.warn("[DOM DEBUG] logoutDiv is not connected to DOM");
        return;
      }
      logoutDiv.style.display = "flex";
    }

    console.log(
      "[DOM DEBUG] Updating username elements:",
      usernameElements.length
    );
    usernameElements.forEach((el, index) => {
      if (!el.isConnected) {
        console.warn(
          `[DOM DEBUG] usernameElement ${index} is not connected to DOM`
        );
        return;
      }
      el.textContent = user.displayName;
    });

    const avatarSeed = encodeURIComponent(user.displayName);
    const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;

    console.log("[DOM DEBUG] Updating avatar images:", avatarImages.length);
    avatarImages.forEach((img, index) => {
      if (!img.isConnected) {
        console.warn(
          `[DOM DEBUG] avatarImage ${index} is not connected to DOM`
        );
        return;
      }
      img.src = avatarUrl;
      img.alt = `${user.displayName}'s avatar`;
      img.style.display = "flex";
    });

    console.log(
      "[DOM DEBUG] Updating avatar containers:",
      avatarContainers.length
    );
    avatarContainers.forEach((div, index) => {
      if (!div.isConnected) {
        console.warn(
          `[DOM DEBUG] avatarContainer ${index} is not connected to DOM`
        );
        return;
      }
      div.style.display = "flex";
    });

    if (errorMessageP) {
      if (!errorMessageP.isConnected) {
        console.warn("[DOM DEBUG] errorMessageP is not connected to DOM");
      } else {
        errorMessageP.textContent = "";
      }
    }

    if (typeof fetchVotedProducts === "function") {
      await fetchVotedProducts();
    }
  }
}

export function showLoggedOutState() {
  console.log("[DOM DEBUG] showLoggedOutState called");

  // CONSOLIDATED: Dispatch event for React AuthContext to handle logout
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth-user-logout"));
  }

  if (signInButton) {
    console.log("[DOM DEBUG] Updating signInButton to show");
    if (!signInButton.isConnected) {
      console.warn(
        "[DOM DEBUG] signInButton is not connected to DOM in showLoggedOutState"
      );
      return;
    }
    signInButton.style.display = "flex";
  }

  if (logoutDiv) {
    logoutDiv.style.display = "none";
  }

  usernameElements.forEach((el) => {
    el.textContent = "";
  });

  const defaultAvatarUrl = "https://api.dicebear.com/9.x/bottts/svg?seed=guest";
  avatarImages.forEach((img) => {
    img.src = defaultAvatarUrl;
    img.alt = "Default avatar";
  });
  avatarContainers.forEach((div) => {
    div.style.display = "none";
  });
}

export function setupLoginHandling(fetchVotedProducts, populateFavoritesTab) {
  signInButton = document.querySelector("button.gsi-material-button");
  logoutDiv = document.getElementById("logout");
  usernameElements = document.querySelectorAll(".username");
  avatarContainers = document.querySelectorAll(".avatar-container");
  avatarImages = document.querySelectorAll(".avatar");
  errorMessageP = document.getElementById("errorMessage");
  favoritesButton = document.getElementById("favoritesBtn");

  if (signInButton) {
    signInButton.addEventListener("click", () => {
      if (errorMessageP) errorMessageP.textContent = "";
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
      if (errorMessageP) errorMessageP.textContent = "";
      localStorage.removeItem("authToken");
      showLoggedOutState();
    });
    logoutDiv.style.cursor = "pointer";
  } else {
    console.warn('Logout div with ID "logout" not found.');
  }

  if (favoritesButton) {
    favoritesButton.addEventListener("click", () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        if (typeof populateFavoritesTab === "function") {
          populateFavoritesTab();
        }
      } else {
        const favsContainer = document.getElementById("favs");
        if (favsContainer) {
          favsContainer
            .querySelectorAll(".fav-item:not(.none)")
            .forEach((item) => item.remove());
        }
      }
    });
  } else {
    console.warn("Favorites button with ID 'favoritesBtn' not found.");
  }

  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  let currentToken = null;

  if (tokenFromUrl) {
    currentToken = tokenFromUrl;
    localStorage.setItem("authToken", currentToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    showLoggedInState(currentToken, fetchVotedProducts);
  } else {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      currentToken = storedToken;
      showLoggedInState(currentToken, fetchVotedProducts);
    } else {
      showLoggedOutState();
    }
  }
}
