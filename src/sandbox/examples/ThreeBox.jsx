import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Interactive 3D box with lid that opens/closes and coins that burst out
export default function ThreeBox() {
  const containerRef = useRef(null);
  const cleanupRef = useRef(() => {});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      target.clientWidth / target.clientHeight,
      0.1,
      100
    );
    camera.position.set(2, 2, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(target.clientWidth, target.clientHeight);
    renderer.setClearColor(0x000000, 0);
    target.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(2, 3, 1);
    scene.add(directional);

    // Box base
    const baseGeometry = new THREE.BoxGeometry(1, 0.6, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const boxBase = new THREE.Mesh(baseGeometry, baseMaterial);
    boxBase.position.y = 0.1;
    scene.add(boxBase);

    // Box lid
    const lidGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const lidMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
    const boxLid = new THREE.Mesh(lidGeometry, lidMaterial);
    boxLid.position.set(0, 0.55, 0);
    scene.add(boxLid);

    // Create coins
    const coinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 8);
    const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const coins = [];
    const coinData = [];

    for (let i = 0; i < 14; i++) {
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(
        (Math.random() - 0.5) * 0.4,
        0.4,
        (Math.random() - 0.5) * 0.4
      );
      coin.visible = false;
      scene.add(coin);
      coins.push(coin);

      coinData.push({
        initialY: coin.position.y,
        vy: 1 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    // Animation variables
    let targetLidRotation = 0;
    let coinsActive = false;
    let internalIsOpen = false; // Internal state for animation loop

    // Click handler
    const onClick = () => {
      setIsOpen((prev) => {
        const newIsOpen = !prev;
        internalIsOpen = newIsOpen; // Update internal state
        targetLidRotation = newIsOpen ? -Math.PI / 2.5 : 0;

        if (newIsOpen && !coinsActive) {
          // Reset coins and show them
          coinsActive = true;
          coins.forEach((coin, i) => {
            coin.position.set(
              (Math.random() - 0.5) * 0.4,
              coinData[i].initialY,
              (Math.random() - 0.5) * 0.4
            );
            coin.rotation.set(0, 0, 0);
            coin.visible = true;
          });
        } else if (!newIsOpen) {
          // Hide coins when closing
          setTimeout(() => {
            coins.forEach((coin) => {
              coin.visible = false;
            });
            coinsActive = false;
          }, 500);
        }

        return newIsOpen;
      });
    };

    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.style.cursor = "pointer";

    // Animation loop
    let raf;
    let lastTime = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Animate lid
      boxLid.rotation.x += (targetLidRotation - boxLid.rotation.x) * dt * 5;

      // Animate coins
      if (coinsActive && internalIsOpen) {
        coins.forEach((coin, i) => {
          const data = coinData[i];
          coin.position.y += data.vy * dt;
          coin.position.x += data.vx * dt;
          coin.position.z += data.vz * dt;
          coin.rotation.y += data.rotationSpeed * dt;
          coin.rotation.x += data.rotationSpeed * 0.5 * dt;

          // Apply gravity
          data.vy -= 2.5 * dt;

          // Reset if too low
          if (coin.position.y < -2) {
            coin.position.set(
              (Math.random() - 0.5) * 0.4,
              data.initialY + Math.random() * 0.3,
              (Math.random() - 0.5) * 0.4
            );
            data.vy = 1 + Math.random() * 1.5;
            data.vx = (Math.random() - 0.5) * 0.3;
            data.vz = (Math.random() - 0.5) * 0.3;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const w = target.clientWidth;
      const h = target.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);

      // Dispose of resources
      baseGeometry.dispose();
      baseMaterial.dispose();
      lidGeometry.dispose();
      lidMaterial.dispose();
      coinGeometry.dispose();
      coinMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };

    return cleanupRef.current;
  }, []); // Remove isOpen dependency to prevent recreation of scene

  useEffect(() => () => cleanupRef.current(), []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: "pointer",
      }}
    />
  );
}
