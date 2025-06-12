import React from "react";
import MostClicked from "../components/MostClicked";
import MostLiked from "../components/MostLiked";

export default function HomeTab() {
  return (
    <div className="tab-content-container">
      <MostClicked />
      <MostLiked />
    </div>
  );
}
