// src/utils/imageValidation.js
/**
 * Utility functions for image validation and error handling
 * Similar to the logic in the external screenNoAnim.js script
 */

/**
 * Checks if an image URL is valid and should be displayed
 * @param {string} imageUrl - The image URL to validate
 * @returns {boolean} - True if the image is valid, false otherwise
 */
export function isValidImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return false;
  }

  // Check for "noimage" URLs (similar to external script)
  if (imageUrl.includes("noimage")) {
    console.warn(
      `Invalid image URL detected (contains "noimage"): ${imageUrl}`
    );
    return false;
  }

  return true;
}

/**
 * Preloads an image and returns a promise that resolves when loaded
 * @param {string} imageUrl - The image URL to preload
 * @returns {Promise<boolean>} - Promise that resolves to true if loaded, false if failed
 */
export function preloadImage(imageUrl) {
  return new Promise((resolve) => {
    if (!isValidImageUrl(imageUrl)) {
      resolve(false);
      return;
    }

    const img = new Image();

    img.onload = () => {
      // Additional check for "noimage" in the loaded image (like external script)
      if (img.currentSrc && img.currentSrc.includes("noimage")) {
        console.warn(`Image contains "noimage", rejecting: ${imageUrl}`);
        resolve(false);
        return;
      }
      resolve(true);
    };

    img.onerror = () => {
      console.warn(`Failed to preload image: ${imageUrl}`);
      resolve(false);
    };

    img.src = imageUrl;
  });
}

/**
 * Preloads multiple images and returns when all are complete
 * @param {string[]} imageUrls - Array of image URLs to preload
 * @returns {Promise<boolean[]>} - Promise that resolves to array of load results
 */
export function preloadImages(imageUrls) {
  const validUrls = imageUrls.filter((url) => isValidImageUrl(url));
  return Promise.all(validUrls.map((url) => preloadImage(url)));
}

/**
 * Validates multiple products by checking their images
 * @param {Array} products - Array of product objects with image property
 * @returns {Promise<Array>} - Promise that resolves to array of products with valid images
 */
export async function validateProductImages(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  const validationPromises = products.map(async (product) => {
    if (!product.image) {
      console.warn(
        `Product ${product.id} has no image, excluding from display`
      );
      return null;
    }

    const isValid = await preloadImage(product.image);
    if (!isValid) {
      console.warn(
        `Product ${product.id} has invalid image (${product.image}), excluding from display`
      );
      return null;
    }

    return product;
  });

  const results = await Promise.all(validationPromises);
  return results.filter((product) => product !== null);
}

/**
 * Standard image error handler for React components
 * @param {Event} e - The error event
 * @param {string} imageUrl - The image URL that failed to load
 */
export function handleImageError(e, imageUrl) {
  // Hide the broken image
  e.target.style.display = "none";

  // Log the error for debugging
  console.warn(`Failed to load image: ${imageUrl}`);

  // Optionally, you could set a placeholder image here:
  // e.target.src = '/assets/placeholder-image.png';
}

/**
 * Standard image error handler that sets a placeholder
 * @param {Event} e - The error event
 * @param {string} imageUrl - The image URL that failed to load
 * @param {string} placeholderUrl - Optional placeholder image URL
 */
export function handleImageErrorWithPlaceholder(
  e,
  imageUrl,
  placeholderUrl = null
) {
  console.warn(`Failed to load image: ${imageUrl}`);

  // If we have a local placeholder, use it
  if (
    placeholderUrl &&
    (placeholderUrl.startsWith("/") || placeholderUrl.startsWith("./assets/"))
  ) {
    e.target.src = placeholderUrl;
    e.target.style.display = "block";
    e.target.style.backgroundColor = "#f0f0f0";
  } else {
    // Hide the broken image if no valid local placeholder
    e.target.style.display = "none";
  }
}
