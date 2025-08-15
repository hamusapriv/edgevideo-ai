import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Token particle (coin)
const Token = ({ i }) => (
  <motion.circle
    key={i}
    cx={50}
    cy={48}
    r={4.5}
    fill="url(#gold)"
    stroke="#E6B800"
    strokeWidth={0.6}
    initial={{ scale: 0, y: 0, opacity: 0 }}
    animate={{
      scale: 1,
      y: -30 - Math.random() * 30,
      x: (Math.random() - 0.5) * 50,
      opacity: 1,
      rotate: Math.random() * 360,
    }}
    exit={{ opacity: 0, scale: 0 }}
    transition={{ duration: 0.9, ease: "easeOut" }}
  />
);

export default function SvgFramerBox() {
  const [open, setOpen] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const [reward, setReward] = useState(null);
  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next) {
      setReward(Math.floor(1000 + Math.random() * 90000));
      setBurstId((id) => id + 1);
    } else {
      setReward(null);
    }
  }, [open]);

  const tokenCount = open ? 10 : 0;

  return (
    <div style={{ display: "inline-block", textAlign: "center" }}>
      <svg
        width={170}
        height={170}
        viewBox="0 0 100 100"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      >
        <defs>
          <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFE57A" />
            <stop offset="60%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FF9800" />
          </linearGradient>
          <linearGradient id="boxFront" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3B3B3B" />
            <stop offset="100%" stopColor="#1F1F1F" />
          </linearGradient>
          <linearGradient id="boxSide" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#444" />
            <stop offset="100%" stopColor="#232323" />
          </linearGradient>
          <linearGradient id="lid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#575757" />
            <stop offset="100%" stopColor="#303030" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 3D-ish box: front and side (no back) */}
        <motion.g
          initial={false}
          animate={{ filter: open ? "url(#glow)" : "none" }}
        >
          {/* Front face */}
          <polygon
            points="22,42 78,42 78,78 22,78"
            fill="url(#boxFront)"
            stroke="#555"
            strokeWidth={1.5}
          />
          {/* Right side face */}
          <polygon
            points="78,42 90,36 90,72 78,78"
            fill="url(#boxSide)"
            stroke="#444"
            strokeWidth={1.2}
          />
          {/* Inner lip */}
          <rect
            x={26}
            y={46}
            width={48}
            height={4}
            fill="#151515"
            opacity={0.6}
          />
        </motion.g>

        {/* Lid group with rotation around front edge for downward opening */}
        <motion.g
          style={{ originX: 50, originY: 42 }} // Changed origin to front edge
          initial={false}
          animate={{ rotateX: open ? -90 : 0 }} // Changed to negative rotation for downward opening
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        >
          {/* Top panel */}
          <polygon
            points="22,40 78,40 90,34 34,34"
            fill="url(#lid)"
            stroke="#666"
            strokeWidth={1.4}
          />
          {/* Rim highlight */}
          <polyline
            points="22,40 78,40 90,34"
            fill="none"
            stroke="#777"
            strokeWidth={1}
          />
        </motion.g>

        {/* Tokens */}
        <AnimatePresence key={burstId}>
          {Array.from({ length: tokenCount }).map((_, i) => (
            <Token key={`${burstId}-token-${i}`} i={i} />
          ))}
        </AnimatePresence>

        {/* Reward number pop */}
        <AnimatePresence>
          {reward && (
            <motion.text
              key={reward}
              x={50}
              y={40}
              textAnchor="middle"
              fontSize={open ? 10 : 0}
              fontWeight="600"
              fill="#FFE082"
              initial={{ y: 48, scale: 0.4, opacity: 0 }}
              animate={{ y: 18, scale: 1, opacity: 1 }}
              exit={{ y: 0, opacity: 0, scale: 0.3 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 1 }}
            >
              +{reward}
            </motion.text>
          )}
        </AnimatePresence>

        {/* Instruction */}
        {!open && (
          <text
            x={50}
            y={90}
            textAnchor="middle"
            fill="#777"
            fontSize={6}
            style={{ userSelect: "none" }}
          >
            Click Box
          </text>
        )}
      </svg>
      <div style={{ fontSize: 12, marginTop: 4 }}>SVG + Framer Motion</div>
    </div>
  );
}
