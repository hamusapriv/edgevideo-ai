import React from "react";
import "../styles/HomePage.css";
import TelegramButton from "./socials-buttons/TelegramButton";
import TwitterButton from "./socials-buttons/TwitterButton";
import LinkedInButton from "./socials-buttons/LinkedInButton";
import YouTubeButton from "./socials-buttons/YouTubeButton";
import MediumButton from "./socials-buttons/MediumButton";

export default function JoinUsSection() {
  return (
    <section className="social">
      <h3>Join Us.</h3>
      <ul className="social__list">
        <li className="social__item">
          <TelegramButton aria-label="Telegram" />
        </li>
        <li className="social__item">
          <TwitterButton aria-label="Twitter" />
        </li>
        <li className="social__item">
          <LinkedInButton aria-label="LinkedIn" />
        </li>
        <li className="social__item">
          <YouTubeButton aria-label="YouTube" />
        </li>
        <li className="social__item">
          <MediumButton aria-label="Medium" />
        </li>
      </ul>
    </section>
  );
}
