import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
/* global process */

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Staging mode: unminified builds with source maps for debugging
  // Production mode: minified builds without source maps for performance
  const isStaging = mode === "staging";

  return {
    plugins: [react()],
    define: {
      __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH || ""),
    },
    build: {
      // Disable minification and enable source maps for staging
      minify: !isStaging,
      sourcemap: isStaging,
      // Additional staging optimizations
      ...(isStaging && {
        rollupOptions: {
          output: {
            // Keep readable chunk names in staging
            chunkFileNames: "[name]-[hash].js",
            entryFileNames: "[name]-[hash].js",
            assetFileNames: "[name]-[hash].[ext]",
          },
        },
      }),
    },
  };
});
