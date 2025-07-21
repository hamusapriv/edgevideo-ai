import React, { useState, useEffect, useRef } from "react";

const AnimatedStat = ({ number, label, delay = 0 }) => {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          setTimeout(() => {
            const duration = 2000; // 2 seconds
            const steps = 60;
            const increment = number / steps;
            let current = 0;

            const timer = setInterval(() => {
              current += increment;
              if (current >= number) {
                setCurrentNumber(number);
                clearInterval(timer);
              } else {
                setCurrentNumber(Math.floor(current));
              }
            }, duration / steps);

            return () => clearInterval(timer);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [number, delay, hasAnimated]);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div ref={ref} className="animated-stat">
      <div className="stat-number">{formatNumber(currentNumber)}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default AnimatedStat;
