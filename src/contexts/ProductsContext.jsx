// src/contexts/ProductsContext.jsx
// This file defines a context for managing products in a React application.

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";
import { getChannelId } from "../legacy/modules/useChannelModule";

const ProductsContext = createContext({
  products: [],
  addProduct: () => {},
  removeProduct: () => {},
  cachedProducts: [],
  cachedProductsLoading: false,
  hasMoreCachedProducts: true,
  loadMoreCachedProducts: () => {},
});

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [cachedProducts, setCachedProducts] = useState([]);
  const [cachedProductsLoading, setCachedProductsLoading] = useState(false);
  const [cachedProductsPage, setCachedProductsPage] = useState(1);
  const [hasMoreCachedProducts, setHasMoreCachedProducts] = useState(true);
  const [cachedProductsInitialized, setCachedProductsInitialized] = useState(
    false
  );

  const addProduct = useCallback((product) => {
    if (!product) return;
    setProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      const next = [...prev, product];
      return next.slice(-10);
    });
  }, []);

  const removeProduct = useCallback((productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  // Load cached products using the same API as screen.js getCachedProducts
  const loadMoreCachedProducts = useCallback(async () => {
    if (cachedProductsLoading || !hasMoreCachedProducts) return;

    const channelId = getChannelId();
    if (!channelId) {
      console.warn("No channel ID available for cached products");
      return;
    }

    setCachedProductsLoading(true);

    try {
      const response = await fetch(
        `https://fastapi.edgevideo.ai/product_search/recent_products/${channelId}/${cachedProductsPage}`
      );

      if (!response.ok) {
        console.error("Cached products API response not ok:", response.status);
        return;
      }

      let cachedProductData = await response.json();

      // Handle different response formats (same logic as screen.js)
      if (!Array.isArray(cachedProductData)) {
        if (cachedProductData && typeof cachedProductData === "object") {
          if (
            cachedProductData.products &&
            Array.isArray(cachedProductData.products)
          ) {
            cachedProductData = cachedProductData.products;
          } else if (
            cachedProductData.data &&
            Array.isArray(cachedProductData.data)
          ) {
            cachedProductData = cachedProductData.data;
          } else {
            console.error("No valid array found in cached products response");
            return;
          }
        } else {
          console.error("Cached products response is not a valid object");
          return;
        }
      }

      if (cachedProductData.length === 0) {
        // No more products available
        setHasMoreCachedProducts(false);
      } else {
        // Filter out products that already exist to prevent duplicates
        setCachedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = cachedProductData.filter(
            (product) => !existingIds.has(product.id)
          );
          return [...prev, ...newProducts];
        });
        setCachedProductsPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error loading cached products:", error);
    } finally {
      setCachedProductsLoading(false);
    }
  }, [cachedProductsLoading, hasMoreCachedProducts, cachedProductsPage]);

  // REMOVED: Automatic cached products loading on page load
  // Cached products should only load when user scrolls down or manually triggered
  // This prevents cached products from appearing before live products

  // CONSOLIDATED: Listen for legacy product events to unify data flow
  useEffect(() => {
    const handleLegacyProduct = (event) => {
      addProduct(event.detail);
    };

    // Listen for both new events and legacy events for compatibility
    window.addEventListener("add-product", handleLegacyProduct);
    window.addEventListener("new-product", handleLegacyProduct);

    return () => {
      window.removeEventListener("add-product", handleLegacyProduct);
      window.removeEventListener("new-product", handleLegacyProduct);
    };
  }, [addProduct]);

  return (
    <ProductsContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        cachedProducts,
        cachedProductsLoading,
        hasMoreCachedProducts,
        loadMoreCachedProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => useContext(ProductsContext);
