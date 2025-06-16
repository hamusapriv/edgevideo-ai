import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
/* global process */

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH || ""),
  },
});
