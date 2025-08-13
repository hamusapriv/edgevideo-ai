// src/config/walletConfig.js
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, polygon } from "wagmi/chains";

// Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  chains: [mainnet, arbitrum, polygon],
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || "demo_project_id", // You'll need to get this from WalletConnect Cloud
});

// AppKit configuration
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  chains: [mainnet, arbitrum, polygon],
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || "demo_project_id",
  metadata: {
    name: "EdgeVideo AI",
    description: "Revolutionary video editing with AI",
    url: "https://edgevideo.ai",
    icons: ["https://edgevideo.ai/logo.png"],
  },
  features: {
    analytics: true, // Enable analytics
  },
});

export { wagmiAdapter };
