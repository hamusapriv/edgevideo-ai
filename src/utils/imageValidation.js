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

  // Check for other common error patterns in URLs
  const errorPatterns = [
    "placeholder",
    "notfound",
    "404",
    "error",
    "missing",
    "unavailable",
    "default-image",
    "no-image",
  ];

  for (const pattern of errorPatterns) {
    if (imageUrl.toLowerCase().includes(pattern)) {
      console.warn(
        `Invalid image URL detected (contains "${pattern}"): ${imageUrl}`
      );
      return false;
    }
  }

  // Check if URL looks suspicious (very short or malformed)
  if (imageUrl.length < 10) {
    console.warn(`Invalid image URL detected (too short): ${imageUrl}`);
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

    // Set a timeout to prevent hanging on slow/unresponsive servers
    const timeout = setTimeout(() => {
      console.warn(`Image loading timeout: ${imageUrl}`);
      resolve(false);
    }, 5000); // 5 second timeout

    img.onload = () => {
      clearTimeout(timeout);

      // Check image dimensions - some services return 1x1 pixel images for errors
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        console.warn(
          `Image too small (likely error image): ${imageUrl} - ${img.naturalWidth}x${img.naturalHeight}`
        );
        resolve(false);
        return;
      }

      // Additional check for "noimage" in the loaded image (like external script)
      if (img.currentSrc && img.currentSrc.includes("noimage")) {
        console.warn(`Image contains "noimage", rejecting: ${imageUrl}`);
        resolve(false);
        return;
      }

      // Check if the image is actually an error page by examining common error patterns
      if (
        img.currentSrc &&
        (img.currentSrc.includes("404") ||
          img.currentSrc.includes("error") ||
          img.currentSrc.includes("notfound") ||
          img.currentSrc.includes("placeholder"))
      ) {
        console.warn(`Image appears to be an error page: ${imageUrl}`);
        resolve(false);
        return;
      }

      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
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

    // Additional check for problematic image services
    if (isProblematicImageService(product.image)) {
      const isValid = await validateImageThoroughly(product.image);
      if (!isValid) {
        console.warn(
          `Product ${product.id} failed thorough validation (${product.image}), excluding from display`
        );
        return null;
      }
      return product;
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
  const validProducts = results.filter((product) => product !== null);

  return validProducts;
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

/**
 * Checks if an image URL is from a known problematic service
 * @param {string} imageUrl - The image URL to check
 * @returns {boolean} - True if the URL is from a problematic service
 */
export function isProblematicImageService(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return false;
  }

  const problematicServices = [
    "productserve.com",
    "images2.productserve.com",
    "cdn.productserve.com",
  ];

  const isProblematic = problematicServices.some((service) =>
    imageUrl.includes(service)
  );

  if (isProblematic) {
    console.log(`🚨 Detected problematic image service in: ${imageUrl}`);
  }

  return isProblematic;
}

/**
 * Enhanced image validation that performs more thorough checks
 * @param {string} imageUrl - The image URL to validate
 * @returns {Promise<boolean>} - Promise that resolves to true if valid
 */
export async function validateImageThoroughly(imageUrl) {
  if (!isValidImageUrl(imageUrl)) {
    return false;
  }

  // If it's from a problematic service, use stricter validation
  if (isProblematicImageService(imageUrl)) {
    console.log(
      `Using thorough validation for potentially problematic service: ${imageUrl}`
    );

    try {
      // Try to fetch the image with a HEAD request first
      const response = await fetch(imageUrl, {
        method: "HEAD",
        timeout: 3000,
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        console.warn(
          `Image HEAD request failed with status ${response.status}: ${imageUrl}`
        );
        return false;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        console.warn(
          `Invalid content type "${contentType}" for image: ${imageUrl}`
        );
        return false;
      }
    } catch (error) {
      console.warn(
        `Failed to validate image with HEAD request: ${imageUrl}`,
        error
      );
      // Fall back to regular preload validation
    }
  }

  // Use the regular preload validation
  return await preloadImage(imageUrl);
}
