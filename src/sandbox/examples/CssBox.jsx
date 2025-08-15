import React, { useState, useRef } from "react";
import "./cssBox.css";

export default function CssBox() {
  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState(null);
  const rewardRef = useRef(null);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const val = Math.floor(1000 + Math.random() * 90000);
      setReward(val);
      // restart animation
      requestAnimationFrame(() => {
        if (rewardRef.current) {
          rewardRef.current.classList.remove("show");
          void rewardRef.current.offsetWidth; // force reflow
          rewardRef.current.classList.add("show");
        }
      });
    } else {
      setReward(null);
    }
  };

  return (
    <div className="css-box-wrapper" onClick={handleToggle}>
      <div className={"box fancy " + (open ? "open" : "")}>
        <div className="lid">
          <div className="lid-top" />
        </div>
        <div className="body">
          <div className="side left" />
          <div className="side right" />
          <div className="side bottom" />
          <div className="front" />
          <div className="back" />
        </div>
        <div className="tokens">
          {open &&
            Array.from({ length: 8 }).map((_, i) => (
              <div className="token" key={i} style={{ "--i": i }} />
            ))}
        </div>
        {reward && (
          <div ref={rewardRef} className="reward-number">
            +{reward}
          </div>
        )}
        {!open && <div className="hint">Click</div>}
      </div>
      <div className="label">Pure CSS</div>
    </div>
  );
}
