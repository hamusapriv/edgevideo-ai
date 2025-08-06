// src/contexts/ProductsContext.jsx
// This file defines a context for managing products in a React application.

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";

const ProductsContext = createContext({
  products: [],
  addProduct: () => {},
});

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);

  const addProduct = useCallback((product) => {
    if (!product) return;
    setProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      const next = [...prev, product];
      return next.slice(-10);
    });
  }, []);

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
    <ProductsContext.Provider value={{ products, addProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => useContext(ProductsContext);
