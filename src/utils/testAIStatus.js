// src/utils/testAIStatus.js
/**
 * Test function to simulate product detection for AI Status testing
 * You can call this from the browser console to test the AI status functionality
 */
export function testAIStatus() {
  const testProduct = {
    id: `test-${Date.now()}`,
    title: "Test Product",
    image:
      "https://m.media-amazon.com/images/I/81hkDUp8GPL._AC_UL480_FMwebp_QL65_.jpg",
    matchType: "SAW",
    explanation:
      "Detected this product in the video stream using computer vision",
    price: 29.99,
    link: "https://example.com/product",
  };

  window.dispatchEvent(new CustomEvent("new-product", { detail: testProduct }));
}

export function testInvalidImage() {
  const testProduct = {
    id: `test-invalid-${Date.now()}`,
    title: "Invalid Image Product",
    image: "https://example.com/noimage.jpg",
    matchType: "SAW",
    explanation: "This should fail image validation",
    price: 19.99,
    link: "https://example.com/product",
  };

  window.dispatchEvent(new CustomEvent("new-product", { detail: testProduct }));
}

// Make functions available globally for testing
if (typeof window !== "undefined") {
  window.testAIStatus = testAIStatus;
  window.testInvalidImage = testInvalidImage;
}
