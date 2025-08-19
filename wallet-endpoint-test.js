/**
 * Wallet Endpoint Test Script
 * Run this in the browser console to test wallet API endpoints
 *
 * Usage:
 * 1. Copy and paste this entire script into the browser console
 * 2. Run: testWalletEndpoints()
 * 3. Check the results in the console
 */

const API_BASE_URL = "https://fastapi.edgevideo.ai";

async function testWalletEndpoints() {
  console.log("🧪 Testing Wallet API Endpoints...\n");

  const authToken = localStorage.getItem("authToken");
  console.log(`🔑 Auth Token: ${authToken ? "✅ Found" : "❌ Not found"}`);

  const results = {
    authToken: authToken ? "Found" : "Not found",
    endpoints: {},
  };

  const endpointsToTest = [
    {
      name: "nonce",
      url: `${API_BASE_URL}/wallet/nonce`,
      method: "POST",
    },
    { name: "link", url: `${API_BASE_URL}/wallet/link`, method: "POST" },
    {
      name: "get_linked",
      url: `${API_BASE_URL}/wallet/get_linked`,
      method: "GET",
    },
  ];

  console.log("\n📡 Testing endpoints...\n");

  for (const endpoint of endpointsToTest) {
    console.log(`Testing ${endpoint.name}: ${endpoint.method} ${endpoint.url}`);

    try {
      const options = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (authToken) {
        options.headers["Authorization"] = `Bearer ${authToken}`;
      }

      if (endpoint.method === "POST") {
        options.body = JSON.stringify({});
      }

      const response = await fetch(endpoint.url, options);

      const result = {
        status: response.status,
        statusText: response.statusText,
        available: response.status !== 404,
        url: endpoint.url,
      };

      results.endpoints[endpoint.name] = result;

      // Status indicator
      let statusIcon = "❌";
      if (response.ok) statusIcon = "✅";
      else if (response.status === 401) statusIcon = "🔐";
      else if (response.status === 404) statusIcon = "📭";
      else if (response.status === 422) statusIcon = "📝"; // Validation error

      console.log(`  ${statusIcon} ${response.status} ${response.statusText}`);

      if (response.ok) {
        try {
          const data = await response.json();
          result.sampleResponse = data;
          console.log(`  📄 Response:`, data);
        } catch (e) {
          const text = await response.text();
          result.sampleResponse = text;
          console.log(`  📄 Response:`, text);
        }
      } else {
        try {
          const errorText = await response.text();
          result.error = errorText;
          console.log(`  ⚠️  Error:`, errorText);
        } catch (e) {
          console.log(`  ⚠️  Could not read error response`);
        }
      }
    } catch (error) {
      results.endpoints[endpoint.name] = {
        status: "NETWORK_ERROR",
        error: error.message,
        url: endpoint.url,
      };
      console.log(`  🔥 Network Error: ${error.message}`);
    }

    console.log(""); // Empty line for readability
  }

  console.log("📊 Test Results Summary:");
  console.log("========================");

  const workingEndpoints = Object.entries(results.endpoints)
    .filter(([_, result]) => result.status < 400)
    .map(([name]) => name);

  const notFoundEndpoints = Object.entries(results.endpoints)
    .filter(([_, result]) => result.status === 404)
    .map(([name]) => name);

  const authRequiredEndpoints = Object.entries(results.endpoints)
    .filter(([_, result]) => result.status === 401)
    .map(([name]) => name);

  const validationErrorEndpoints = Object.entries(results.endpoints)
    .filter(([_, result]) => result.status === 422)
    .map(([name]) => name);

  console.log(
    `✅ Working: ${
      workingEndpoints.length ? workingEndpoints.join(", ") : "None"
    }`
  );
  console.log(
    `🔐 Auth Required: ${
      authRequiredEndpoints.length ? authRequiredEndpoints.join(", ") : "None"
    }`
  );
  console.log(
    `📝 Validation Error: ${
      validationErrorEndpoints.length
        ? validationErrorEndpoints.join(", ")
        : "None"
    }`
  );
  console.log(
    `📭 Not Found: ${
      notFoundEndpoints.length ? notFoundEndpoints.join(", ") : "None"
    }`
  );

  console.log("\n💾 Full results object:");
  console.log(results);

  return results;
}

// Also test if the wallet service is available
async function testWalletService() {
  console.log("\n🔧 Testing Wallet Service...");

  try {
    // Check if wallet service exists
    if (typeof window.walletService !== "undefined") {
      console.log("✅ Wallet service found");

      // Test the new endpoint testing method
      if (typeof window.walletService.testWalletEndpoints === "function") {
        console.log("✅ testWalletEndpoints method available");
        console.log("🧪 Running wallet service endpoint test...\n");

        const results = await window.walletService.testWalletEndpoints();
        console.log("📊 Wallet Service Test Results:", results);
        return results;
      } else {
        console.log("❌ testWalletEndpoints method not found");
      }
    } else {
      console.log("❌ Wallet service not found on window object");
      console.log("💡 Try running this after the app has fully loaded");
    }
  } catch (error) {
    console.log("🔥 Error testing wallet service:", error);
  }
}

// Combined test function
async function runAllTests() {
  console.log("🚀 Running All Wallet Tests");
  console.log("============================\n");

  const directResults = await testWalletEndpoints();
  const serviceResults = await testWalletService();

  return {
    direct: directResults,
    service: serviceResults,
  };
}

// Instructions
console.log(`
🔧 Wallet Endpoint Test Script Loaded!

Available commands:
• testWalletEndpoints() - Test endpoints directly
• testWalletService() - Test via wallet service  
• runAllTests() - Run both tests

Quick start: runAllTests()
`);
