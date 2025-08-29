// Debug utilities for check-in testing
// For CEO testing - force clear check-in state to test fanfare

export function clearCheckinState() {
  localStorage.removeItem("lastDailyCheckin");
  localStorage.removeItem("lastCheckinDisplay");
  localStorage.removeItem("dailyCheckinStreak");
  console.log("🧹 Check-in state cleared - fanfare should show on next login");
}

export function getCheckinState() {
  const state = {
    lastDailyCheckin: localStorage.getItem("lastDailyCheckin"),
    lastCheckinDisplay: localStorage.getItem("lastCheckinDisplay"),
    dailyCheckinStreak: localStorage.getItem("dailyCheckinStreak"),
  };
  console.log("📊 Current check-in state:", state);
  return state;
}

export function triggerTestFanfare() {
  const testEvent = new CustomEvent("dailyCheckinReward", {
    detail: {
      days: 7,
      value: 100,
      total: 700,
      success: true,
    },
  });

  console.log("🧪 Manually triggering test fanfare");
  window.dispatchEvent(testEvent);
}

// Make available globally for console debugging
if (typeof window !== "undefined") {
  window.checkinDebug = {
    clear: clearCheckinState,
    state: getCheckinState,
    test: triggerTestFanfare,
  };

  console.log(
    "🔧 Check-in debug utilities available: window.checkinDebug.clear(), window.checkinDebug.state(), window.checkinDebug.test()"
  );
}
