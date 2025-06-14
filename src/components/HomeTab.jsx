import React from "react";
import MostClicked from "./MostClicked";
import MostLiked from "./MostLiked";

export default function HomeTab() {
  return (
    <div className="tab-content-container">
      <MostClicked />
      <MostLiked />
    </div>
  );
}
