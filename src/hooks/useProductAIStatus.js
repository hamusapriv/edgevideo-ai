// src/hooks/useProductAIStatus.js
import { useCallback } from "react";
import { isValidImageUrl, preloadImage } from "../utils/imageValidation";

export function useProductAIStatus(setShoppingAIStatus) {
  const processProductWithAIStatus = useCallback(
    async (product) => {
      if (!product) return null;

      console.log("Processing new product:", product);

      // Step 1: Check if product image is valid
      if (!isValidImageUrl(product.image)) {
        console.warn("Invalid product image, skipping:", product.image);
        setShoppingAIStatus("Invalid product image detected");
        setTimeout(
          () => setShoppingAIStatus("Searching for products..."),
          3000
        );
        return null;
      }

      // Step 2: Display AI match information
      if (product.matchType && product.explanation) {
        setShoppingAIStatus(`AI ${product.matchType} ${product.explanation}`);
      } else if (product.matchType) {
        setShoppingAIStatus(`AI ${product.matchType}`);
      } else {
        setShoppingAIStatus("Analyzing product...");
      }

      // Step 3: Show "product found" message briefly
      setTimeout(() => {
        setShoppingAIStatus("Product found");
      }, 1500);

      // Step 4: Preload image during animation and validate
      setTimeout(async () => {
        try {
          const imageLoaded = await preloadImage(product.image);
          if (!imageLoaded) {
            console.warn(
              "Product image failed to load properly:",
              product.image
            );
            setShoppingAIStatus("Product image validation failed");
            setTimeout(
              () => setShoppingAIStatus("Searching for products..."),
              2000
            );
          } else {
            // Image loaded successfully, return to searching state
            setTimeout(
              () => setShoppingAIStatus("Searching for products..."),
              3000
            );
          }
        } catch (error) {
          console.error("Error validating product image:", error);
          setShoppingAIStatus("Image validation error");
          setTimeout(
            () => setShoppingAIStatus("Searching for products..."),
            2000
          );
        }
      }, 500);

      return product;
    },
    [setShoppingAIStatus]
  );

  return { processProductWithAIStatus };
}
