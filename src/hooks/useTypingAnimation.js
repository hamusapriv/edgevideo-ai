// src/hooks/useTypingAnimation.js
import { useState, useEffect, useRef } from "react";

export const useTypingAnimation = (text, speed = 100) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const animationRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    if (!text) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    animationRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
        return;
      }
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }, speed);
    // Cleanup interval if text changes again
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [text, speed]);

  return { displayedText, isTyping };
};
