// src/components/Socials.jsx
import React from "react";
import EmailButton from "./socials-buttons/EmailButton";
import TelegramButton from "./socials-buttons/TelegramButton";
import TwitterButton from "./socials-buttons/TwitterButton";
import LinkedInButton from "./socials-buttons/LinkedInButton";
import YouTubeButton from "./socials-buttons/YouTubeButton";
import MediumButton from "./socials-buttons/MediumButton";

export default function Socials() {
  return (
    <div className="contact-container">
      <ul className="socials-ul w-list-unstyled">
        <li className="second-screen-social">
          <EmailButton />
        </li>
        <li className="second-screen-social">
          <TelegramButton />
        </li>
        <li className="second-screen-social">
          <TwitterButton />
        </li>
        <li className="second-screen-social">
          <LinkedInButton />
        </li>
        <li className="second-screen-social">
          <YouTubeButton />
        </li>
        <li className="second-screen-social">
          <MediumButton />
        </li>
      </ul>
    </div>
  );
}
