import React, { createContext, useCallback, useContext, useState } from "react";

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

  return (
    <ProductsContext.Provider value={{ products, addProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => useContext(ProductsContext);
