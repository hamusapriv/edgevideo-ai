import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import fs from "fs";
/* global process */

// Get build info
function getBuildInfo() {
  try {
    // Get package.json version
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const version = packageJson.version;

    // Get git commit hash (short)
    const commitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();

    // Get git branch
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();

    // Get build timestamp
    const buildTime = new Date().toISOString();

    return {
      version,
      commitHash,
      branch,
      buildTime,
    };
  } catch (error) {
    console.warn("Could not get git info:", error.message);
    return {
      version: "unknown",
      commitHash: "unknown",
      branch: "unknown",
      buildTime: new Date().toISOString(),
    };
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Staging mode: unminified builds with source maps for debugging
  // Production mode: minified builds without source maps for performance
  const isStaging = mode === "staging";

  // Google Analytics ID based on environment
  const GA_ID = isStaging ? "G-STAGING-ID" : "G-3GZF6H0L3V";

  // Get build info - in dev mode, provide simpler fallbacks
  let buildInfo;
  if (mode === "development") {
    buildInfo = {
      version: JSON.parse(fs.readFileSync("package.json", "utf8")).version,
      commitHash: "dev",
      branch: "main",
      buildTime: new Date().toISOString(),
    };
  } else {
    buildInfo = getBuildInfo();
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true, // Fail if port 5173 is not available
      host: true, // Listen on all local IPs
    },
    configureServer(server) {
      // Add middleware to handle Coinbase Wallet HEAD requests
      server.middlewares.use("/app", (req, res, next) => {
        if (req.method === "HEAD") {
          // Handle HEAD request for Coinbase Wallet COOP check
          res.writeHead(200, {
            "Content-Type": "text/html",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
          });
          res.end();
          return;
        }
        next();
      });
    },
    define: {
      __COMMIT_HASH__: JSON.stringify(
        process.env.COMMIT_HASH || buildInfo.commitHash
      ),
      __VERSION__: JSON.stringify(buildInfo.version),
      __BUILD_TIME__: JSON.stringify(buildInfo.buildTime),
      __BRANCH__: JSON.stringify(buildInfo.branch),
      __GA_ID__: JSON.stringify(GA_ID),
    },
    resolve: {
      alias: {
        // Ensure React is properly resolved
        react: "react",
        "react-dom": "react-dom",
      },
    },
    build: {
      // Disable minification and enable source maps for staging
      minify: !isStaging,
      sourcemap: false, // Disable source maps for faster builds
      // Increase chunk size warning limit to reduce warnings
      chunkSizeWarningLimit: 1000,
      // Copy additional files to dist
      rollupOptions: {
        input: {
          main: "index.html",
        },
        output: {
          // Suppress Rollup warnings for external dependencies
          manualChunks: {
            vendor: ["react", "react-dom"],
            three: ["three"],
            wallet: ["@rainbow-me/rainbowkit", "@tanstack/react-query", "viem"],
          },
          ...(isStaging && {
            // Keep readable chunk names in staging
            chunkFileNames: "[name]-[hash].js",
            entryFileNames: "[name]-[hash].js",
            assetFileNames: "[name]-[hash].[ext]",
          }),
        },
        // REMOVED the problematic external configuration
        // This was causing modules to not be bundled properly
        onwarn: (warning, warn) => {
          // Suppress specific warnings that slow down build
          if (warning.code === "EVAL" && warning.id?.includes("lottie-web"))
            return;
          if (warning.message?.includes("/*#__PURE__*/")) return;
          if (warning.message?.includes("ox/_esm")) return;
          if (warning.code === "LARGE_BUNDLE") return; // Suppress large bundle warnings
          warn(warning);
        },
      },
    },
  };
});
