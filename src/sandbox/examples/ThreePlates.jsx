import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Progress bar component to show rotation progress through frames
function FrameScrollbar({
  currentFrame,
  totalFrames,
  rotationProgress,
  onRotationChange,
  className,
}) {
  // Calculate progress position (0 to 1)
  const progressPosition = rotationProgress || currentFrame / (totalFrames - 1);

  // Responsive SVG dimensions
  const isMobile = window.innerWidth <= 768;
  const svgWidth = 1000; // Base width for viewBox
  const svgHeight = isMobile ? 24 : 16; // Larger height for mobile
  const strokeWidth = isMobile ? 4 : 3; // Thicker stroke for mobile
  const circleRadius = isMobile ? 8 : 6; // Larger circles for mobile

  // Create frame indicator circles
  const circles = [];
  for (let i = 0; i < totalFrames; i++) {
    const isActive = i === currentFrame;
    const x =
      circleRadius + (i * (svgWidth - 2 * circleRadius)) / (totalFrames - 1);
    circles.push(
      <circle
        key={i}
        cx={x}
        cy={svgHeight / 2}
        r={circleRadius}
        fill={isActive ? "#00F7FF" : "white"}
        opacity={isActive ? 1 : 0.6}
        stroke={isActive ? "#ffffff" : "none"}
        strokeWidth={isActive ? 2 : 0}
      />
    );
  }

  // Calculate progress indicator position - smooth scrolling using rotationProgress
  const progressX =
    circleRadius + rotationProgress * (svgWidth - 2 * circleRadius) + 1;

  // Handle click and drag on the scrollbar
  const handleInteraction = (e, svgElement) => {
    if (!onRotationChange || !svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Convert screen coordinates to SVG coordinates
    const svgX = (x / rect.width) * svgWidth;

    // Calculate progress based on SVG coordinates
    const trackStart = circleRadius;
    const trackEnd = svgWidth - circleRadius;
    const progress = Math.max(
      0,
      Math.min(1, (svgX - trackStart) / (trackEnd - trackStart))
    );

    // Convert progress to rotation (0 to 2π) and account for the π/2 offset
    // The progress calculation adds π/2, so we need to subtract it here
    const rotation = progress * Math.PI * 2 - Math.PI / 2;
    onRotationChange(rotation);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const svgElement = e.currentTarget;
    handleInteraction(e, svgElement);

    const handleMouseMove = (moveEvent) => {
      handleInteraction(moveEvent, svgElement);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const svgElement = e.currentTarget;
    const touch = e.touches[0];
    const touchEvent = { clientX: touch.clientX, clientY: touch.clientY };
    handleInteraction(touchEvent, svgElement);

    const handleTouchMove = (moveEvent) => {
      const touch = moveEvent.touches[0];
      const touchEvent = { clientX: touch.clientX, clientY: touch.clientY };
      handleInteraction(touchEvent, svgElement);
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleClick = (e) => {
    handleInteraction(e, e.currentTarget);
  };

  return (
    <div
      className={className}
      style={{
        width: "90vw",
        maxWidth: "800px",
        height: isMobile ? "24px" : "16px", // Larger height for mobile
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{
          cursor: "pointer",
          userSelect: "none",
          touchAction: "none",
          overflow: "visible",
        }}
      >
        {/* Background track */}
        <path
          d={`M${circleRadius} ${svgHeight / 2}H${svgWidth - circleRadius}`}
          stroke="url(#paint0_linear_track)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Progress track */}
        <path
          d={`M${circleRadius} ${svgHeight / 2}H${progressX}`}
          stroke="url(#paint0_linear_progress)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Frame indicator circles */}
        {circles}

        {/* Progress indicator (moving circle) */}
        <circle
          cx={progressX}
          cy={svgHeight / 2}
          r={circleRadius + 2}
          fill="url(#paint0_radial_progress)"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.9"
        />

        <defs>
          <linearGradient
            id="paint0_linear_track"
            x1={circleRadius}
            y1={svgHeight / 2}
            x2={svgWidth - circleRadius}
            y2={svgHeight / 2}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00F7FF" />
            <stop offset="0.509631" stopColor="#003ECF" />
            <stop offset="1" stopColor="#5100FF" />
          </linearGradient>

          <linearGradient
            id="paint0_linear_progress"
            x1={circleRadius}
            y1={svgHeight / 2}
            x2={svgWidth - circleRadius}
            y2={svgHeight / 2}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00F7FF" />
            <stop offset="0.509631" stopColor="#003ECF" />
            <stop offset="1" stopColor="#5100FF" />
          </linearGradient>

          <radialGradient
            id="paint0_radial_progress"
            cx="0.5"
            cy="0.5"
            r="0.5"
            gradientUnits="objectBoundingBox"
          >
            <stop stopColor="#00F7FF" />
            <stop offset="1" stopColor="#003ECF" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// Video frame catalogue with rotation and position controls
export default function ThreePlates() {
  const containerRef = useRef(null);
  const cleanupRef = useRef(() => {});
  const groupRef = useRef(null);
  const manualRotationRef = useRef(0); // Ref to access current rotation in animation loop
  const markActiveRef = useRef(() => {}); // Ref to access markActive function

  // State for controls and current frame tracking
  const [rotation, setRotation] = useState({ x: Math.PI / 2, y: 0, z: 0 });
  const [position, setPosition] = useState({ x: 0, y: 3, z: 0 });
  const [showControls, setShowControls] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [manualRotation, setManualRotation] = useState(0); // SVG scrollbar controls this

  // Callback for SVG scrollbar to control rotation
  const handleRotationChange = (newRotation) => {
    setManualRotation(newRotation);
    manualRotationRef.current = newRotation; // Update ref for animation loop
    markActiveRef.current(); // Mark user as active when using scrollbar
  };

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    // PARAMS (tweak quickly)
    const RECT_COUNT = 11;
    const RADIUS = 6.5; // Increased radius for larger 16:9 plates
    const AUTO_SPIN_SPEED = 0.1; // radians per second when idle
    const IDLE_TIMEOUT = 2000; // ms after last user action to resume auto spin

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // transparent

    const camera = new THREE.PerspectiveCamera(
      70,
      target.clientWidth / target.clientHeight,
      0.1,
      100
    );

    // Responsive camera positioning
    const isMobile =
      window.innerWidth <= 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      camera.position.set(10, 5, 8);
      camera.lookAt(-20, -1, 0); // Look at the center of the plates
    } else {
      camera.position.set(0, 5, 12);
      camera.lookAt(-12, 0, 0); // Look at the center of the plates
    }

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(target.clientWidth, target.clientHeight);
    target.appendChild(renderer.domElement);

    // Track user interaction to pause auto-spin
    let userActive = false;
    let lastInteraction = performance.now();
    const markActive = () => {
      userActive = true;
      lastInteraction = performance.now();
    };
    markActiveRef.current = markActive; // Make markActive accessible to callback

    // Lights - simplified setup for better performance
    const ambient = new THREE.AmbientLight(0xffffff, 0.4); // Base ambient light
    scene.add(ambient);

    // Main directional light for texture illumination
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(2, 3, 5); // Positioned to light the front faces
    scene.add(mainLight);

    // Subtle environment approximation using a gradient cube render target
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const envGeom = new THREE.SphereGeometry(50, 32, 16);
    const envMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      map: new THREE.CanvasTexture(
        (() => {
          const c = document.createElement("canvas");
          c.width = 256;
          c.height = 256;
          const g = c.getContext("2d");
          const grd = g.createLinearGradient(0, 0, 0, 256);
          grd.addColorStop(0, "#1c2030");
          grd.addColorStop(1, "#06080d");
          g.fillStyle = grd;
          g.fillRect(0, 0, 256, 256);
          return c;
        })()
      ),
    });
    envScene.add(new THREE.Mesh(envGeom, envMat));
    const envRT = pmrem.fromScene(envScene).texture;

    // Geometry / material - 16:9 aspect ratio for video frame catalogue
    const plateWidth = 4.8; // 16 units wide
    const plateHeight = 2.7; // 9 units tall (16:9 ratio)
    const geometry = new RoundedBoxGeometry(
      0.15,
      plateWidth,
      plateHeight,
      3,
      0.06
    );

    // Load frame images as textures
    const textureLoader = new THREE.TextureLoader();
    const frameTextures = [];
    for (let i = 1; i <= 11; i++) {
      const texture = textureLoader.load(
        `/assets/frame-product-pairs/Frame-Image-${i}.png`,
        // onLoad callback
        () => {
          console.log(`Frame texture ${i} loaded successfully`);
        },
        // onProgress callback
        undefined,
        // onError callback
        (error) => {
          console.error(`Failed to load Frame-Image-${i}.png:`, error);
        }
      );
      // Apply texture rotation and settings safely
      texture.center.set(0.5, 0.5);
      texture.rotation = Math.PI / 2;

      // Add padding by scaling down the texture
      // Calculate padding ratio (3-5px padding on a texture)
      // Assuming texture resolution of ~512px, 4px padding = 4/512 = ~0.008
      const paddingRatio = 0.02; // 2% padding on each side (4% total reduction)
      texture.repeat.set(1 - paddingRatio * 2, 1 - paddingRatio * 2);
      texture.offset.set(paddingRatio, paddingRatio);

      texture.wrapS = THREE.ClampToEdgeWrap;
      texture.wrapT = THREE.ClampToEdgeWrap;
      frameTextures.push(texture);
    }

    // Create a fallback texture in case images don't load
    const canvas = document.createElement("canvas");
    canvas.width = 640; // 16:9 aspect ratio
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#2d3748";
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Video Frame", 320, 160);
    ctx.fillText("Placeholder", 320, 200);
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.center.set(0.5, 0.5);
    fallbackTexture.rotation = Math.PI / 2;

    // Add padding to fallback texture as well
    const paddingRatio = 0.02; // Same padding as regular textures
    fallbackTexture.repeat.set(1 - paddingRatio * 2, 1 - paddingRatio * 2);
    fallbackTexture.offset.set(paddingRatio, paddingRatio);

    // Create materials - one with texture for the front face, one plain for other faces
    const baseMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.1, // Reduced metalness for better diffuse lighting
      roughness: 0.6, // Increased roughness for more diffuse look
      envMap: envRT,
      envMapIntensity: 0.3, // Reduced env map intensity to let textures show more
      color: 0x2d3748, // Dark color for non-textured faces
    });

    const texturedMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.0, // No metalness for pure texture display
      roughness: 0.8, // High roughness for diffuse texture appearance
      envMap: envRT,
      envMapIntensity: 0.2, // Low env map intensity to prioritize texture
      color: 0xffffff, // Pure white to not tint the texture
      map: fallbackTexture, // will be overridden per instance
    });

    // Multi-material array: [+X, -X, +Y, -Y, +Z, -Z] faces
    // We want texture only on the -Z face (back), others use base material
    const materials = [
      baseMaterial, // +X (right)
      texturedMaterial, // -X (left)
      baseMaterial, // +Y (top)
      baseMaterial, // -Y (bottom)
      baseMaterial, // +Z (front)
      baseMaterial, // -Z (back) - this gets the texture
    ];

    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Create individual meshes instead of instanced for unique textures per plate
    const plates = [];

    for (let i = 0; i < RECT_COUNT; i++) {
      const angle = (i / RECT_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * RADIUS;
      const y = Math.sin(angle) * RADIUS;
      const z = 0; // Static Z position, no wave animation

      // Create materials array with texture for this plate
      const textureIndex = i % frameTextures.length;
      const frameTexture = frameTextures[textureIndex];

      // Clone the textured material and apply the specific frame texture
      const plateTexturedMaterial = texturedMaterial.clone();
      if (frameTexture) {
        plateTexturedMaterial.map = frameTexture;
        plateTexturedMaterial.needsUpdate = true;
      }

      // Create materials array for this specific plate
      const plateMaterials = [
        baseMaterial, // +X (right)
        plateTexturedMaterial, // -X (left)
        baseMaterial, // +Y (top)
        baseMaterial, // -Y (bottom)
        baseMaterial, // +Z (front)
        baseMaterial, // -Z (back) - this gets the texture (faces outward after rotation)
      ];

      // Main plate mesh
      const plateMesh = new THREE.Mesh(geometry, plateMaterials);
      plateMesh.position.set(x, y, z);
      plateMesh.rotation.z = angle + Math.PI / 2;
      plateMesh.userData = { index: i, baseScale: 1 };
      plates.push(plateMesh);
      group.add(plateMesh);
    }

    // Manual wheel rotation - only rotate around Z-axis like a wheel
    // Rotation is now controlled by the SVG scrollbar only    // Animation loop
    let raf;
    let lastTime = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Auto-spin logic
      if (performance.now() - lastInteraction > IDLE_TIMEOUT) {
        userActive = false;
      }

      // Apply auto-spin when user is not active
      if (!userActive) {
        const newRotation = manualRotationRef.current + AUTO_SPIN_SPEED * dt;
        manualRotationRef.current = newRotation;
        setManualRotation(newRotation);
      }

      // Update individual plate positions (static positions, no scaling)
      for (let i = 0; i < RECT_COUNT; i++) {
        const ang = (i / RECT_COUNT) * Math.PI * 2;
        const x = Math.cos(ang) * RADIUS;
        const y = Math.sin(ang) * RADIUS;
        const z = 0; // Static Z position, no wave animation

        // Update main plate
        plates[i].position.set(x, y, z);
        plates[i].rotation.z = ang + Math.PI / 2;
      }

      // Calculate which frame is currently at the front (closest to camera)
      // The front position is where the plate is closest to the camera (negative Y direction)
      // Use manual rotation from SVG scrollbar
      let normalizedRotation =
        ((manualRotationRef.current % (Math.PI * 2)) + Math.PI * 2) %
        (Math.PI * 2);
      // Calculate which segment of the circle is at the front
      // Add π/2 to offset for our coordinate system where front is at -Y
      let frontAngle = (normalizedRotation + Math.PI / 2) % (Math.PI * 2);
      // Calculate continuous rotation progress (0 to 1)
      let progress = (frontAngle / (Math.PI * 2)) % 1;
      // Calculate frame index (0-based) using floor to ensure consistency with progress
      let frameIndex = Math.floor(progress * RECT_COUNT) % RECT_COUNT;

      // Update current frame state if it changed
      if (frameIndex !== currentFrame) {
        setCurrentFrame(frameIndex);
      }
      // Update rotation progress (for smooth scrollbar animation)
      setRotationProgress(progress);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = target.clientWidth;
      const h = target.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Update camera position based on new window size
      const isMobile =
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isMobile) {
        camera.position.set(10, 5, 8);
        camera.lookAt(-20, -1, 0);
      } else {
        camera.position.set(0, 5, 12);
        camera.lookAt(-12, 0, 0);
      }
    };
    window.addEventListener("resize", onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);

      // Dispose of frame textures
      frameTextures.forEach((texture) => texture.dispose());
      fallbackTexture.dispose();

      // Dispose of individual plate materials (each plate has an array of materials)
      plates.forEach((plate) => {
        if (Array.isArray(plate.material)) {
          plate.material.forEach((material) => {
            if (material && typeof material.dispose === "function") {
              material.dispose();
            }
          });
        } else if (
          plate.material &&
          typeof plate.material.dispose === "function"
        ) {
          plate.material.dispose();
        }
      });

      geometry.dispose();
      baseMaterial.dispose();
      texturedMaterial.dispose();
      pmrem.dispose();
      envMat.dispose();
      envGeom.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    return cleanupRef.current;
  }, []);

  useEffect(() => () => cleanupRef.current(), []);

  // Effect to update group rotation and position when controls change
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
      groupRef.current.position.set(position.x, position.y, position.z);
    }
  }, [rotation, position]);

  // Effect to update manual Z rotation from SVG scrollbar
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z = manualRotation;
    }
  }, [manualRotation]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent", // Make background transparent for hero
          touchAction: window.innerWidth <= 768 ? "pan-y" : "none", // Allow vertical scrolling on mobile
          pointerEvents: window.innerWidth <= 768 ? "none" : "auto", // Disable pointer events on mobile for scrolling
          userSelect: "none", // Prevent text selection
          WebkitUserSelect: "none", // Safari
          msUserSelect: "none", // IE/Edge
          WebkitTouchCallout: "none", // Disable iOS touch callout
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "auto", // Allow interaction with the scrollbar
        }}
      >
        <FrameScrollbar
          currentFrame={currentFrame}
          totalFrames={11}
          rotationProgress={rotationProgress}
          onRotationChange={handleRotationChange}
        />
      </div>
    </div>
  );
}
