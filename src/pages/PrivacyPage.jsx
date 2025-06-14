// src/pages/PrivacyPage.jsx
import React, { useEffect, useRef } from "react";

export default function PrivacyPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    const SCRIPT_ID = "__enzuzo-root-script";
    const container = containerRef.current;
    if (!container) return;

    // 1) Clean out any prior policy or script
    container.innerHTML = "";
    const oldScript = document.getElementById(SCRIPT_ID);
    if (oldScript) oldScript.remove();

    // 2) Inject the Enzuzo loader into *this* container
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src =
      "https://app.enzuzo.com/scripts/privacy/56930700-9623-11ef-9fc5-5f846ab761ce";
    s.async = true;
    container.appendChild(s);

    // 3) Cleanup on unmount
    return () => {
      container.innerHTML = "";
      const script = document.getElementById(SCRIPT_ID);
      if (script) script.remove();
    };
  }, []);

  // This div lives inside your React <div id="root">,
  // so everything Enzuzo injects will stay in React's tree.
  return (
    <div
      ref={containerRef}
      id="__enzuzo-root"
      data-enzuzo-mode="csr"
      data-enzuzo-type="privacy"
      style={{ padding: "2rem" }}
    />
  );
}
