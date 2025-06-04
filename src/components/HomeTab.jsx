// src/components/HomeTab.jsx
import React from "react";
import MostClicked from "../components/MostClicked";
import Trending from "../components/Trending";
import { mostClicked, mostLiked } from "../services/staticProducts";

export default function HomeTab() {
  return (
    <div className="tab-content-container">
      <MostClicked items={mostClicked} />
      <Trending items={mostLiked} />
    </div>
  );
}
