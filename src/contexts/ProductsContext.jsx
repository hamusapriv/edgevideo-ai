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
  const [hasMoreCachedProducts, setHasMoreCachedProducts] = useState(true);
  const [cachedProductsInitialized, setCachedProductsInitialized] = useState(
    false
  );
  // Pre-fetched cached products pool (for serving one by one)
  const [preFetchedPool, setPreFetchedPool] = useState([]);
  const [poolInitialized, setPoolInitialized] = useState(false);

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

  // Pre-fetch 50 cached products on page load for serving one by one
  const preFetchCachedProducts = useCallback(async () => {
    if (poolInitialized) return;

    const channelId = getChannelId();
    if (!channelId) {
      console.warn("No channel ID available for pre-fetching");
      return;
    }

    console.log(
      "🚀 Pre-fetching cached products from page 50 for one-by-one serving..."
    );

    try {
      // Fetch page 50 directly - should contain ~50 products in one call
      const response = await fetch(
        `https://fastapi.edgevideo.ai/product_search/recent_products/${channelId}/50`
      );

      if (!response.ok) {
        console.error("Pre-fetch API response not ok:", response.status);
        return;
      }

      let cachedProductData = await response.json();

      // Handle different response formats
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
            console.error("No valid array found in pre-fetch response");
            return;
          }
        } else {
          console.error("Pre-fetch response is not a valid object");
          return;
        }
      }

      if (cachedProductData.length === 0) {
        console.log("� No cached products returned from page 50");
        setHasMoreCachedProducts(false);
        return;
      }

      // Sort by time (newest first for serving)
      cachedProductData.sort((a, b) => {
        const timeA = a.time || 0;
        const timeB = b.time || 0;
        return timeB - timeA; // newest first
      });

      setPreFetchedPool(cachedProductData);
      setPoolInitialized(true);

      console.log(
        `🎯 Pre-fetch complete: ${cachedProductData.length} products ready for one-by-one serving`
      );
      console.log(
        `📊 Time range: newest = ${cachedProductData[0]?.time}, oldest = ${
          cachedProductData[cachedProductData.length - 1]?.time
        }`
      );
    } catch (error) {
      console.error("Error during pre-fetch:", error);
    }
  }, [poolInitialized]);

  // Load one cached product at a time from pre-fetched pool
  // Load one cached product at a time from pre-fetched pool
  const loadMoreCachedProducts = useCallback(async () => {
    if (cachedProductsLoading || !hasMoreCachedProducts) return;

    // Initialize pre-fetch pool if not done yet
    if (!poolInitialized) {
      await preFetchCachedProducts();
      return;
    }

    setCachedProductsLoading(true);

    try {
      // Filter pool to exclude live products and already added cached products
      const existingCachedIds = new Set(cachedProducts.map((p) => p.id));
      const liveProductIds = new Set(products.map((p) => p.id));

      const availableProducts = preFetchedPool.filter(
        (product) =>
          !existingCachedIds.has(product.id) && !liveProductIds.has(product.id)
      );

      if (availableProducts.length === 0) {
        console.log("📭 No more cached products available from pool");
        setHasMoreCachedProducts(false);
        return;
      }

      // Get the newest available product (first in sorted array)
      const nextProduct = availableProducts[0];

      // Add one product to cached products
      setCachedProducts((prev) => [...prev, nextProduct]);

      console.log(
        `➕ Added cached product from pool: ${nextProduct.title ||
          nextProduct.id}`
      );
      console.log(
        `📊 Product time: ${
          nextProduct.time
        }, Products remaining in pool: ${availableProducts.length - 1}`
      );

      // Check if we have more products left
      if (availableProducts.length <= 1) {
        console.log("📭 Pool exhausted, no more cached products available");
        setHasMoreCachedProducts(false);
      }
    } catch (error) {
      console.error("Error loading cached product from pool:", error);
    } finally {
      setCachedProductsLoading(false);
    }
  }, [
    cachedProductsLoading,
    hasMoreCachedProducts,
    poolInitialized,
    preFetchedPool,
    cachedProducts,
    products,
    preFetchCachedProducts,
  ]);

  // Pre-fetch cached products on page load
  useEffect(() => {
    preFetchCachedProducts();
  }, [preFetchCachedProducts]);

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
