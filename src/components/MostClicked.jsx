import React, { useEffect, useState } from "react";
import { apiService } from "../services/apiService";

export default function MostClicked() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService
      .fetchMostClicked()
      .then((data) => setItems(data))
      .catch((err) => {
        console.error("Failed to load most-clicked:", err);
        setError("Could not load clicked products");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading featured…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="most-clicked">
      <h4>Featured Products</h4>
      <ul id="clicked-list">
        {items.map((p, idx) => (
          <li className="product-card" key={idx}>
            <a
              className="product-img-title"
              href={p.link_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="product-image-container clicked">
                <img className="product-image" src={p.image_url} alt={p.name} />
              </div>
              <strong className="product-name">{p.name}</strong>
            </a>
            <small className="product-count">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="currentColor"
                className="icon-heart"
                viewBox="0 0 16 16"
              >
                <path d="M5.95915 0C4.86516 0 3.96346 0.774554 3.96346 1.71429V8.46429L3.5269 8.07143L3.36059 7.94643C2.59402 7.28795 1.34151 7.28795 0.574932 7.94643C-0.191644 8.60491 -0.191644 9.6808 0.574932 10.3393V10.3571L6.02152 14.9821L6.0631 15L6.08389 15.0357C6.98039 15.6138 8.12376 16 9.41005 16H10.5534C13.5703 16 16 13.9129 16 11.3214V6.85714C16 5.91741 15.0983 5.14286 14.0043 5.14286C13.7211 5.14286 13.4586 5.20982 13.2143 5.30357C12.9961 4.56027 12.2087 4 11.281 4C10.7717 4 10.304 4.17188 9.95055 4.44643C9.59714 4.17188 9.1294 4 8.62008 4C8.38621 4 8.16533 4.04241 7.95485 4.10714V1.71429C7.95485 0.774554 7.05315 0 5.95915 0ZM5.95915 1.14286C6.32815 1.14286 6.62439 1.39732 6.62439 1.71429V8H7.95485V5.71429C7.95485 5.39732 8.25109 5.14286 8.62008 5.14286C8.98908 5.14286 9.28531 5.39732 9.28531 5.71429V8H10.6158V5.71429C10.6158 5.39732 10.912 5.14286 11.281 5.14286C11.65 5.14286 11.9462 5.39732 11.9462 5.71429V8H13.3391V6.85714C13.3391 6.54018 13.6353 6.28571 14.0043 6.28571C14.3733 6.28571 14.6695 6.54018 14.6695 6.85714V11.3214C14.6695 13.3013 12.8583 14.8571 10.5534 14.8571H9.41005C8.43558 14.8571 7.59365 14.558 6.89464 14.1071L1.51041 9.53571C1.21418 9.28125 1.21418 9.00446 1.51041 8.75C1.80665 8.49554 2.12887 8.49554 2.42511 8.75L5.29392 11.2143V1.71429C5.29392 1.39732 5.59016 1.14286 5.95915 1.14286Z" />
              </svg>{" "}
              <span>{p.click_count}</span>
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
