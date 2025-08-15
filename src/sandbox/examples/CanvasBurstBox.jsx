import React, { useRef, useState, useEffect, useCallback } from "react";

function useParticles(openSignal) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef();

  const spawn = useCallback(() => {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: 70,
        y: 70,
        vx: (Math.random() - 0.5) * 5,
        vy: -(Math.random() * 5 + 4),
        r: 4 + Math.random() * 3,
        life: 0,
        maxLife: 70 + Math.random() * 25,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    if (openSignal) spawn();
  }, [openSignal, spawn]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    function loop() {
      const canvas = canvasRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = 0.18;
      particlesRef.current.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += g;
      });
      particlesRef.current = particlesRef.current.filter(
        (p) => p.life < p.maxLife
      );
      particlesRef.current.forEach((p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          p.x - 2,
          p.y - 2,
          1,
          p.x,
          p.y,
          p.r
        );
        gradient.addColorStop(0, `rgba(255,215,0,${alpha})`);
        gradient.addColorStop(1, `rgba(255,140,0,0)`);
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return canvasRef;
}

export default function CanvasBurstBox() {
  const [isOpen, setIsOpen] = useState(false); // Changed to boolean state
  const [reward, setReward] = useState(null);
  const canvasRef = useParticles(isOpen ? 1 : 0); // Pass 1 or 0 based on state

  const handleClick = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      // Only show reward when opening
      setReward(Math.floor(1000 + Math.random() * 90000));
      setTimeout(() => setReward(null), 1200);
    }
  };

  return (
    <div
      style={{
        display: "inline-block",
        textAlign: "center",
        margin: "0 24px",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <div style={{ position: "relative", width: 140, height: 140 }}>
        {/* Box base with 3D appearance */}
        <div
          style={{
            position: "absolute",
            left: 25,
            top: 66,
            width: 90,
            height: 56,
            background: "linear-gradient(145deg, #4a4a4a, #2a2a2a)",
            border: "2px solid #666",
            borderRadius: 4,
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.1), 4px 4px 8px rgba(0,0,0,0.3)",
          }}
        />

        {/* Right side panel for 3D effect */}
        <div
          style={{
            position: "absolute",
            left: 115,
            top: 62,
            width: 12,
            height: 56,
            background: "linear-gradient(135deg, #333, #222)",
            border: "2px solid #555",
            borderLeft: "none",
            borderRadius: "0 4px 4px 0",
            transform: "skewY(-10deg)",
          }}
        />

        {/* Bottom panel for 3D effect */}
        <div
          style={{
            position: "absolute",
            left: 29,
            top: 118,
            width: 90,
            height: 12,
            background: "linear-gradient(to bottom, #333, #222)",
            border: "2px solid #555",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            transform: "skewX(-10deg)",
          }}
        />

        {/* Lid with proper 3D appearance */}
        <div
          style={{
            position: "absolute",
            left: 25,
            top: 54,
            width: 90,
            height: 26,
            background: "linear-gradient(145deg, #606060, #404040)",
            border: "2px solid #777",
            borderRadius: 4,
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            transformOrigin: "50% 100%",
            transform: `rotateX(${isOpen ? -85 : 0}deg) translateY(${
              isOpen ? -8 : 0
            }px)`,
            transition: "transform .55s cubic-bezier(.22,.9,.3,1)",
            zIndex: 2,
          }}
        />

        {/* Lid side panel */}
        <div
          style={{
            position: "absolute",
            left: 115,
            top: 54,
            width: 12,
            height: 26,
            background: "linear-gradient(135deg, #505050, #303030)",
            border: "2px solid #666",
            borderLeft: "none",
            borderRadius: "0 4px 4px 0",
            transform: `skewY(-10deg) rotateX(${isOpen ? -85 : 0}deg)`,
            transformOrigin: "0% 100%",
            transition: "transform .55s cubic-bezier(.22,.9,.3,1)",
            zIndex: 1,
          }}
        />
        <canvas
          ref={canvasRef}
          width={140}
          height={140}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
          }}
        />
        {reward && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 60,
              transform: "translate(-50%,0)",
              fontWeight: 600,
              fontSize: 14,
              color: "#FFE082",
              textShadow:
                "0 0 6px rgba(255,193,7,.7),0 0 12px rgba(255,140,0,.4)",
              animation: "rewardPop 1.1s forwards",
            }}
          >
            +{reward}
          </div>
        )}
        {!open && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 104,
              transform: "translateX(-50%)",
              fontSize: 11,
              color: "#777",
              letterSpacing: ".5px",
              pointerEvents: "none",
            }}
          >
            Click
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, marginTop: 6, color: "#888" }}>
        Canvas Burst
      </div>
      <style>{`@keyframes rewardPop { 0% { transform:translate(-50%,0) scale(.3); opacity:0;} 25% { transform:translate(-50%,-10px) scale(1.05); opacity:1;} 55% { transform:translate(-50%,-28px) scale(1); opacity:1;} 100% { transform:translate(-50%,-50px) scale(.6); opacity:0; } }`}</style>
    </div>
  );
}
