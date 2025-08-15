import React, { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";

/**
 * Clean, valid Lottie JSON
 * - Lid opens with overshoot + settle
 * - Soft inner glow burst
 * - Three sparks that scale, drift, and fade
 * - Unique layer indices, no stray keyframes, consistent ip/op
 */
const boxOpenAnimation = {
  v: "5.7.6",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "treasure_box_complete",
  ddd: 0,
  assets: [],
  layers: [
    // Base
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "box-base",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 130, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          nm: "BaseGroup",
          it: [
            {
              ty: "rc",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [84, 52] },
              r: { a: 0, k: 8 },
              nm: "BaseRect",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.2, 0.15, 0.1, 1] },
              o: { a: 0, k: 100 },
              nm: "BaseFill",
            },
            {
              ty: "st",
              c: { a: 0, k: [0.4, 0.3, 0.2, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2,
              ml: 4,
              nm: "BaseStroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },

    // Right side (fake 3D)
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "box-side",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [142, 125, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          nm: "SideGroup",
          it: [
            {
              ty: "sh",
              nm: "SidePath",
              ks: {
                a: 0,
                k: {
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  v: [
                    [0, -25],
                    [15, -30],
                    [15, 22],
                    [0, 25],
                  ],
                  c: true,
                },
              },
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.15, 0.1, 0.05, 1] },
              o: { a: 0, k: 100 },
              nm: "SideFill",
            },
            {
              ty: "st",
              c: { a: 0, k: [0.3, 0.2, 0.1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 2 },
              lc: 2,
              lj: 2,
              ml: 4,
              nm: "SideStroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },

    // Lid
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "box-lid",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        // Overshoot open -> rebound -> settle
        r: {
          a: 1,
          k: [
            {
              t: 0,
              s: [0],
              e: [-105],
              i: { x: [0.4], y: [0] },
              o: { x: [0.2], y: [1] },
            },
            {
              t: 18,
              s: [-105],
              e: [-88],
              i: { x: [0.6], y: [1] },
              o: { x: [0.4], y: [0] },
            },
            {
              t: 28,
              s: [-88],
              e: [-95],
              i: { x: [0.6], y: [1] },
              o: { x: [0.4], y: [0] },
            },
          ],
        },
        p: { a: 0, k: [100, 105, 0] },
        a: { a: 0, k: [0, 15, 0] }, // pivot along the back edge
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          nm: "LidGroup",
          it: [
            {
              ty: "rc",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [84, 30] },
              r: { a: 0, k: 8 },
              nm: "LidRect",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.6, 0.4, 0.2, 1] },
              o: { a: 0, k: 100 },
              nm: "LidFill",
            },
            {
              ty: "st",
              c: { a: 0, k: [0.8, 0.6, 0.3, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2,
              ml: 4,
              nm: "LidStroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },

    // Inner glow burst
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "glow-burst",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 8, s: [0], e: [90] },
            { t: 20, s: [90], e: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 95, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 8, s: [10, 10, 100], e: [180, 180, 100] },
            { t: 24, s: [180, 180, 100], e: [240, 240, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: "gr",
          nm: "GlowGroup",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [20, 20] },
              nm: "Ellipse",
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.85, 0.4, 1] },
              o: { a: 0, k: 70 },
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 8,
      op: 40,
      st: 8,
      bm: 0,
    },

    // Spark 1
    {
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: "spark-1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 10, s: [0], e: [100] },
            { t: 22, s: [100], e: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            {
              t: 10,
              s: [100, 80, 0],
              e: [100, 50, 0],
              i: { x: [0.4, 0.4, 0.4], y: [0.9, 0.9, 0.9] },
              o: { x: [0.6, 0.6, 0.6], y: [0.1, 0.1, 0.1] },
            },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [{ t: 10, s: [10, 10, 100], e: [180, 180, 100] }],
        },
      },
      shapes: [
        {
          ty: "gr",
          nm: "SparkCircle1",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [16, 16] },
              nm: "Ellipse",
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 0.8, 0.2, 1] },
              w: { a: 0, k: 3 },
              o: { a: 0, k: 100 },
              lc: 1,
              lj: 1,
              ml: 4,
              nm: "Stroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 10,
      op: 40,
      st: 10,
      bm: 0,
    },

    // Spark 2
    {
      ddd: 0,
      ind: 6,
      ty: 4,
      nm: "spark-2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 12, s: [0], e: [100] },
            { t: 26, s: [100], e: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [{ t: 12, s: [132, 76, 0], e: [145, 55, 0] }],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [{ t: 12, s: [8, 8, 100], e: [160, 160, 100] }],
        },
      },
      shapes: [
        {
          ty: "gr",
          nm: "SparkSolid2",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [12, 12] },
              nm: "Ellipse",
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.55, 0.15, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 12,
      op: 44,
      st: 12,
      bm: 0,
    },

    // Spark 3
    {
      ddd: 0,
      ind: 7,
      ty: 4,
      nm: "spark-3",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 14, s: [0], e: [100] },
            { t: 30, s: [100], e: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [{ t: 14, s: [68, 74, 0], e: [55, 58, 0] }],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [{ t: 14, s: [6, 6, 100], e: [140, 140, 100] }],
        },
      },
      shapes: [
        {
          ty: "gr",
          nm: "SparkStroke3",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [10, 10] },
              nm: "Ellipse",
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 0.85, 0.4, 1] },
              w: { a: 0, k: 2 },
              o: { a: 0, k: 100 },
              lc: 1,
              lj: 1,
              ml: 4,
              nm: "Stroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 14,
      op: 46,
      st: 14,
      bm: 0,
    },
  ],
};

export default function LottieBox() {
  const [version, setVersion] = useState(0);
  const [reward, setReward] = useState(null);
  const lottieRef = useRef(null);

  useEffect(() => {
    // Reward number pops with each replay
    const val = Math.floor(1000 + Math.random() * 90000);
    setReward(val);
    const t = setTimeout(() => setReward(null), 1300);
    return () => clearTimeout(t);
  }, [version]);

  const trigger = () => setVersion((v) => v + 1);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open treasure box"
      onClick={trigger}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") trigger();
      }}
      style={{
        width: 200,
        height: 200,
        display: "inline-block",
        textAlign: "center",
        margin: "0 24px",
        cursor: "pointer",
        position: "relative", // <-- so reward positions correctly
        userSelect: "none",
        outline: "none",
      }}
    >
      <Lottie
        key={version} // force remount to replay
        lottieRef={lottieRef}
        animationData={boxOpenAnimation}
        loop={false}
        autoplay
        style={{ height: "100%", width: "100%" }}
      />

      {reward && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 60,
            transform: "translate(-50%,0)",
            fontWeight: 700,
            fontSize: 14,
            color: "#FFE082",
            textShadow:
              "0 0 6px rgba(255,193,7,.7),0 0 12px rgba(255,140,0,.4)",
            animation: "rewardPop 1.1s forwards",
            pointerEvents: "none",
            willChange: "transform, opacity",
          }}
        >
          +{reward}
        </div>
      )}

      <div style={{ fontSize: 12, marginTop: 6, color: "#888" }}>
        Lottie (custom inline box open)
      </div>

      <style>{`
        @keyframes rewardPop {
          0% { transform: translate(-50%,0) scale(.3); opacity: 0; }
          25% { transform: translate(-50%,-10px) scale(1.06); opacity: 1; }
          55% { transform: translate(-50%,-28px) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50px) scale(.65); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lottie, [style*="animation: rewardPop"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
