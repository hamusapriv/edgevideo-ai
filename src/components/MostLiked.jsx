import React, { useEffect, useState } from "react";
import { apiService } from "../services/apiService"; // CONSOLIDATED: Use centralized API service

export default function MostLiked() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // CONSOLIDATED: Use centralized API service instead of direct fetch
    apiService
      .fetchMostLiked()
      .then((data) => setItems(data))
      .catch((err) => {
        console.error("Failed to load most-liked:", err);
        setError("Could not load liked products");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading liked…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="most-liked">
      <h4>Trending Now</h4>
      <ul id="liked-list">
        {items.map((p, idx) => (
          <li className="product-card" key={idx}>
            <a
              className="product-img-title"
              href={p.link_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="product-image-container liked">
                <img className="product-image" src={p.image_url} alt={p.name} />
              </div>
              <strong className="product-name">{p.name}</strong>
            </a>
            <small className="product-count">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 20"
                className="icon-heart"
                aria-hidden="true"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                         2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                         C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                         c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>{" "}
              <span>{p.net_likes}</span>
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
