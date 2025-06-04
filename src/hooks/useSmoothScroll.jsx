// src/hooks/useSmoothScroll.jsx
import { useEffect } from "react";

export default function useSmoothScroll() {
  useEffect(() => {
    const selector = 'a[href^="#"]';
    const links = Array.from(document.querySelectorAll(selector));

    function handleClick(e) {
      const href = this.getAttribute("href");
      if (href.length > 1 && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({ behavior: "smooth" });
      }
    }

    links.forEach((link) => link.addEventListener("click", handleClick));
    return () => {
      links.forEach((link) => link.removeEventListener("click", handleClick));
    };
  }, []);
}
