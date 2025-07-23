import { saveAs } from "file-saver";

export async function downloadProduct(product) {
  // Build the product object with required fields
  const data = {
    id: product.id,
    name: product.title || product.name || "",
    img_url: product.image || "",
    frame_url: product.frame_url || product.back_image || "",
    price: product.price || "",
    price_unit: product.price_unit || product.currency || "USD", // Default to USD if not provided
    match_type: product.matchType || "",
    ai_description: product.explanation || product.description || "",
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  // Sanitize product name for filename (remove unsafe characters)
  const safeName = (data.name || `product-${data.id || Date.now()}`)
    .replace(/[^a-z0-9\-_\.]+/gi, "_")
    .substring(0, 64); // limit length for safety
  saveAs(blob, `${safeName}.json`);
}
