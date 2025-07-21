import { useEffect, useRef, useState } from "react";

export const useInfiniteScroll = (speed = 1, pauseOnHover = true) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;

    if (!container || !track) return;

    let isInitialized = false;
    let itemWidth = 0;
    let itemCount = 0;

    const setupAnimation = () => {
      // Get original items (not clones)
      const originalItems = Array.from(track.children).filter(
        (item) => !item.hasAttribute("data-clone")
      );

      if (originalItems.length === 0) return;

      // Clean up existing clones
      const existingClones = track.querySelectorAll('[data-clone="true"]');
      existingClones.forEach((clone) => clone.remove());

      // Calculate single item width (assuming all items are same width)
      const firstItem = originalItems[0];
      const itemRect = firstItem.getBoundingClientRect();
      const itemStyles = window.getComputedStyle(firstItem);
      const marginLeft = parseFloat(itemStyles.marginLeft) || 0;
      const marginRight = parseFloat(itemStyles.marginRight) || 0;

      itemWidth = itemRect.width + marginLeft + marginRight + 32; // 32px gap
      itemCount = originalItems.length;

      // Create enough clones to fill the container width plus some buffer
      const containerWidth = container.getBoundingClientRect().width;
      const totalItemsNeeded =
        Math.ceil(containerWidth / itemWidth) + itemCount + 2;

      // Add clones
      for (let i = 0; i < totalItemsNeeded; i++) {
        const itemToClone = originalItems[i % originalItems.length];
        const clone = itemToClone.cloneNode(true);
        clone.setAttribute("data-clone", "true");
        track.appendChild(clone);
      }

      isInitialized = true;
    };

    const animate = () => {
      if (!isPaused && isInitialized) {
        scrollPositionRef.current += speed;

        // Keep the scroll position bounded to prevent infinity
        const maxPosition = itemWidth * itemCount;
        if (scrollPositionRef.current >= maxPosition) {
          scrollPositionRef.current = 0;
        }

        // Apply the position directly without making it negative infinity
        const position = -scrollPositionRef.current;

        track.style.transform = `translateX(${position}px)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Setup with delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      setupAnimation();
      animationRef.current = requestAnimationFrame(animate);
    }, 100);

    // Pause on hover handlers
    const handleMouseEnter = () => pauseOnHover && setIsPaused(true);
    const handleMouseLeave = () => pauseOnHover && setIsPaused(false);

    if (pauseOnHover) {
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (pauseOnHover && container) {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }

      // Clean up clones
      if (track) {
        const clones = track.querySelectorAll('[data-clone="true"]');
        clones.forEach((clone) => clone.remove());
      }
    };
  }, [speed, isPaused, pauseOnHover]);

  return { containerRef, trackRef };
};
