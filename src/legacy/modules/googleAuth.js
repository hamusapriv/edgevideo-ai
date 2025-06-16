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
      const message = errorJson?.message || "Session invalid. Please log in again.";
      throw new Error(message);
    }
    if (!response.ok) {
      let errorJson = null;
      try {
        errorJson = await response.json();
      } catch (e) {}
      const message =
        errorJson?.message || `Failed to fetch user details (Status: ${response.status})`;
      throw new Error(message);
    }

    const userData = await response.json();
    const displayName = userData.name || userData.email || "User";
    return { ...userData, displayName };
  } catch (error) {
    console.error("Error fetching user details:", error);
    if (errorMessageP) {
      errorMessageP.textContent = error.message || "Could not retrieve user information.";
    }
    showLoggedOutState();
    return null;
  }
}

async function showLoggedInState(currentToken, fetchVotedProducts) {
  const user = await fetchUserDetails(currentToken);

  if (user) {
    if (signInButton) {
      signInButton.style.display = "none";
    }

    if (logoutDiv) {
      logoutDiv.style.display = "flex";
    }

    usernameElements.forEach((el) => {
      el.textContent = user.displayName;
    });

    const avatarSeed = encodeURIComponent(user.displayName);
    const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;
    avatarImages.forEach((img) => {
      img.src = avatarUrl;
      img.alt = `${user.displayName}'s avatar`;
      img.style.display = "flex";
    });
    avatarContainers.forEach((div) => {
      div.style.display = "flex";
    });

    if (errorMessageP) errorMessageP.textContent = "";

    console.log(`Logged in as: ${user.displayName} (${user.email})`);

    if (typeof fetchVotedProducts === "function") {
      await fetchVotedProducts();
    }
  }
}

export function showLoggedOutState() {
  if (signInButton) {
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

  console.log("Showing logged out state.");
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
      const googleLoginUrl = `${authRouteBase}/google?redirectUri=${encodeURIComponent(frontendUrl)}`;
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
      console.log("Favorites button clicked.");
      const token = localStorage.getItem("authToken");
      if (token) {
        if (typeof populateFavoritesTab === "function") {
          populateFavoritesTab();
        }
      } else {
        console.log("User not logged in, cannot show favorites.");
        const favsContainer = document.getElementById("favs");
        if (favsContainer) {
          favsContainer.querySelectorAll(".fav-item:not(.none)").forEach((item) => item.remove());
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
    console.log("Token received from URL, attempting login...");
    showLoggedInState(currentToken, fetchVotedProducts);
  } else {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      console.log("Token found in localStorage, attempting login...");
      currentToken = storedToken;
      showLoggedInState(currentToken, fetchVotedProducts);
    } else {
      console.log("No token found. Showing logged out state.");
      showLoggedOutState();
    }
  }
}
