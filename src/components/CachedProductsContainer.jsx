// src/components/CachedProductsContainer.jsx
import React, { useEffect, useRef, useCallback } from "react";
import { useProducts } from "../contexts/ProductsContext";
import ProductCard from "./ProductCard";

export default function CachedProductsContainer() {
  const {
    cachedProducts,
    cachedProductsLoading,
    hasMoreCachedProducts,
    loadMoreCachedProducts,
  } = useProducts();

  const scrollContainerRef = useRef(null);
  const loadTriggerRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for infinite scroll
  const setupInfiniteScroll = useCallback(() => {
    if (!loadTriggerRef.current || !hasMoreCachedProducts) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !cachedProductsLoading) {
          loadMoreCachedProducts();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observerRef.current.observe(loadTriggerRef.current);
  }, [hasMoreCachedProducts, cachedProductsLoading, loadMoreCachedProducts]);

  // Setup and cleanup intersection observer
  useEffect(() => {
    setupInfiniteScroll();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupInfiniteScroll]);

  // Handle manual load more button click
  const handleLoadMore = () => {
    if (!cachedProductsLoading && hasMoreCachedProducts) {
      loadMoreCachedProducts();
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="cached-products-loading">
      <div className="loading-spinner"></div>
      <span>Loading more products...</span>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="cached-products-empty">
      <p>No cached products available</p>
    </div>
  );

  if (cachedProducts.length === 0 && !cachedProductsLoading) {
    return (
      <div className="cached-products-container">
        <div className="cached-products-header">
          <h3>Cached Products</h3>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="cached-products-container">
      <div className="cached-products-header">
        <h3>Cached Products ({cachedProducts.length})</h3>
      </div>

      <div
        className="cached-products-scroll-container"
        ref={scrollContainerRef}
      >
        <div className="cached-products-grid">
          {cachedProducts.map((product) => (
            <div key={product.id} className="cached-product-item">
              <ProductCard
                product={product}
                showDetails={false}
                focused={false}
              />
            </div>
          ))}
        </div>

        {/* Load trigger for intersection observer */}
        {hasMoreCachedProducts && (
          <div ref={loadTriggerRef} className="load-trigger">
            {cachedProductsLoading && <LoadingSpinner />}
          </div>
        )}

        {/* Fallback load more button */}
        {hasMoreCachedProducts && !cachedProductsLoading && (
          <div className="load-more-container">
            <button onClick={handleLoadMore} className="load-more-button">
              Load More Products
            </button>
          </div>
        )}

        {/* End of data indicator */}
        {!hasMoreCachedProducts && cachedProducts.length > 0 && (
          <div className="end-of-data">
            <p>You've reached the end of cached products</p>
          </div>
        )}
      </div>
    </div>
  );
}
