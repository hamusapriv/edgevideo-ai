/**
 * Wallet Linking Status Test Script
 * Run this in the browser console to test the wallet linking status check
 *
 * Usage:
 * 1. Copy and paste this entire script into the browser console
 * 2. Run: testWalletLinkingStatus()
 * 3. Check the results in the console
 */

async function testWalletLinkingStatus() {
  console.log("🔧 Testing Wallet Linking Status Check...\n");

  const authToken = localStorage.getItem("authToken");
  console.log(`🔑 Auth Token: ${authToken ? "✅ Found" : "❌ Not found"}`);

  if (!authToken) {
    console.log("❌ Please log in first before testing wallet linking status");
    return;
  }

  // Test the /wallet/get_linked endpoint directly
  console.log("\n📡 Testing /wallet/get_linked endpoint...");

  try {
    const response = await fetch("https://fastapi.edgevideo.ai/wallet/get_linked", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Response:", data);
      
      if (data.walletAddress) {
        console.log(`🔗 Linked wallet found: ${data.walletAddress}`);
      } else {
        console.log("ℹ️ No wallet linked to this account");
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }

  // Test the wallet service method
  console.log("\n🧪 Testing rainbowKitWalletService.getLinkedWallet()...");

  try {
    if (window.rainbowKitWalletService) {
      const result = await window.rainbowKitWalletService.getLinkedWallet();
      console.log("✅ Wallet Service Response:", result);
    } else if (window.walletService) {
      console.log("ℹ️ Using fallback wallet service");
      // Add fallback if needed
    } else {
      console.log("❌ Wallet service not found on window object");
    }
  } catch (error) {
    console.log(`❌ Wallet Service Error: ${error.message}`);
  }

  // Test the isWalletLinked method
  console.log("\n🔍 Testing rainbowKitWalletService.isWalletLinked()...");

  try {
    if (window.rainbowKitWalletService) {
      const status = await window.rainbowKitWalletService.isWalletLinked();
      console.log("✅ Wallet Link Status:", status);
    } else {
      console.log("❌ Wallet service not found on window object");
    }
  } catch (error) {
    console.log(`❌ Wallet Link Status Error: ${error.message}`);
  }
}

// Test wallet connection state
function testWalletConnectionState() {
  console.log("🔧 Testing Current Wallet Connection State...\n");

  // Check localStorage
  const walletVerification = localStorage.getItem("walletVerification");
  const walletConnected = localStorage.getItem("walletConnected");
  const walletAddress = localStorage.getItem("walletAddress");

  console.log("📦 LocalStorage State:");
  console.log(`  Wallet Verification: ${walletVerification || "None"}`);
  console.log(`  Wallet Connected: ${walletConnected || "None"}`);
  console.log(`  Wallet Address: ${walletAddress || "None"}`);

  // Check if rainbowKit state
  if (window.wagmi && window.wagmi.getAccount) {
    const account = window.wagmi.getAccount();
    console.log("\n🌈 RainbowKit/Wagmi State:");
    console.log(`  Connected: ${account.isConnected}`);
    console.log(`  Address: ${account.address || "None"}`);
    console.log(`  Chain ID: ${account.chainId || "None"}`);
  }

  // Check wallet service state
  if (window.rainbowKitWalletService) {
    console.log("\n🔧 Wallet Service State:");
    console.log(`  Account: ${window.rainbowKitWalletService.account || "None"}`);
    console.log(`  Connected: ${window.rainbowKitWalletService.isConnected}`);
    console.log(`  Verified: ${window.rainbowKitWalletService.isVerified}`);
  }
}

// Combined test
async function runWalletTests() {
  console.log("🚀 Running Complete Wallet Tests...\n");
  
  testWalletConnectionState();
  await testWalletLinkingStatus();
  
  console.log("\n✅ Tests completed!");
}

// Instructions
console.log(`
🔧 Wallet Linking Test Script Loaded!

Available commands:
• testWalletLinkingStatus() - Test the /wallet/get_linked endpoint
• testWalletConnectionState() - Check current wallet connection state  
• runWalletTests() - Run both tests

Quick start: runWalletTests()

💡 Expected behavior after fix:
1. When you refresh the page, wallet linking status should be checked from server
2. If wallet was linked before, it should show as verified automatically
3. Local state should sync with server state
`);
