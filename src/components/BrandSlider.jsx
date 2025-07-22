import React from "react";

const logos = [
  { src: "/assets/brands/Adidas_Logo.png", alt: "Adidas" },
  { src: "/assets/brands/Hurley-Logo.png", alt: "Hurley" },
  { src: "/assets/brands/QVC_logo.png", alt: "QVC" },
  { src: "/assets/brands/Under_armour_logo.png", alt: "Under Armour" },
  { src: "/assets/brands/coes-logo.png", alt: "Coes" },
  { src: "/assets/brands/hotelbeds_logo.png", alt: "Hotelbeds" },
  { src: "/assets/brands/kate-spade-logo.png", alt: "Kate Spade" },
  { src: "/assets/brands/lidl_logo.png", alt: "Lidl" },
  { src: "/assets/brands/timberland_logo.png", alt: "Timberland" },
  { src: "/assets/brands/viator-logo.png", alt: "Viator" },
];

export default function BrandSlider() {
  const items = logos.concat(logos);

  return (
    <div className="brands-slider">
      <div className="brands-track">
        {items.map((logo, index) => (
          <img
            key={index}
            className="brand-logo"
            src={logo.src}
            alt={logo.alt}
          />
        ))}
      </div>
    </div>
  );
}
