import React, { useState, useRef, useEffect } from "react";
import "../styles/FAQ.css";

const FAQ_DATA = [
  {
    question: "1. What is Edge Video AI?",
    answer:
      "Edge Video AI is an AI-powered shoppable broadcasting solution that transforms any video stream into an interactive shopping experience by identifying products and tickets in real time and allowing viewers to make purchases directly from their screens.",
  },
  {
    question: "2. How does Edge Video AI work?",
    answer:
      "The platform scans live video feeds using computer vision and audio to detect products or tickets, then proposes these to viewers, who can view them and complete purchases without leaving the stream. Our product matches are a combination of exact matches (the product is the same or very similar to what you see) and contextual matches (products relevant to the scene).",
  },
  {
    question: "3 . How Do I Make Purchases while Watching a Stream?",
    answer:
      "It’s really simple - you scan the QR code on your screen with a mobile device. This opens a Shoppable TV webstore on your phone which displays matched products and tickets. You can then simply click on the “Buy Now” button next to the product or service and can then complete the transaction from a trusted partner like Amazon, QVC, Viator and many others.",
  },
  {
    question: "4 . Which platforms and channels does Edge Video AI support?",
    answer:
      "Edge Video AI integrates seamlessly with linear, FAST (free ad-supported TV), and live streaming channels, and is already used across platforms like Samsung and Roku.",
  },
  {
    question: "5 . What payment methods does Edge Video AI accept?",
    answer:
      "The platform scans live video feeds using computer vision and audio to detect products or tickets, then proposes these to viewers, who can view them and complete purchases without leaving the stream. Our product matches are a combination of exact matches (the product is the same or very similar to what you see) and contextual matches (products relevant to the scene).",
  },
  {
    question: "6 . Which e-commerce platforms does Edge Video AI partner with?",
    answer:
      "Edge Video AI’s product database is connected to many global partners such as Amazon, QVC and Viator as well as platforms such as AWIN and Partnerize and we are adding more every day to offer a diverse product range for various shoppable streams.",
  },
  {
    question: "7 . What data insights does Edge Video AI provide?",
    answer:
      "The platform delivers non-personal viewer engagement data and insights, helping publishers optimize their services by reporting how audiences interact with content and products during streams.",
  },
  {
    question: "8 . How is viewer privacy protected?",
    answer: (
      <>
        We value everyone’s privacy. Please find our Data Privacy{" "}
        <a
          href="https://www.edgevideo.ai/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </>
    ),
  },
];

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  const answerRef = useRef(null);

  // toggle open/close
  const toggle = () => setOpen((o) => !o);

  // adjust max-height on open/resize
  useEffect(() => {
    const el = answerRef.current;
    if (!el) return;

    if (open) {
      el.style.maxHeight = el.scrollHeight + "px";
    } else {
      el.style.maxHeight = "0px";
    }
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (open && answerRef.current) {
        answerRef.current.style.maxHeight =
          answerRef.current.scrollHeight + "px";
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <div className="faq-item">
      <div className="question" onClick={toggle}>
        <span>{faq.question}</span>
        <button
          className={`faq-toggle-btn${open ? " open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          {open ? "–" : "+"}
        </button>
      </div>
      <div ref={answerRef} className={`answer${open ? " open" : ""}`}>
        {faq.answer}
      </div>
    </div>
  );
}

export default function FAQ({ isOpen, onClose }) {
  return (
    <div className={`faq${isOpen ? " open" : ""}`}>
      <h4>FAQs</h4>
      {FAQ_DATA.map((faq, i) => (
        <FaqItem key={i} faq={faq} />
      ))}
      <button
        className="faq-close-btn"
        aria-label="Close FAQs"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
