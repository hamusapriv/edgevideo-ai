import React from "react";

const channels = [
  { name: "ATP Media", id: "2d192295-4e70-4187-a06d-55ecac2f9bf6" },
  { name: "CW Networks", id: "946027d4-367c-4f7d-90e4-4929638d60bc" },
  { name: "Danger TV", id: "a1ba66f8-4540-444d-be98-bc5f761169c0" },
  { name: "EuroNews", id: "4deb3daf-a58c-4da5-aabc-e84f00eb50da" },
  { name: "Insight TV (EU)", id: "3af7a440-2c68-45bc-ab31-9384fc4c4bcb" },
  { name: "Insight TV (UK)", id: "ada3896d-0456-4589-95fa-cf71718b79c8" },
  { name: "Insight TV (US)", id: "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e" },
  { name: "MVMNT Culture", id: "ba08370c-0362-462d-b299-97cc36973340" },
  { name: "Narative Entertainment", id: "ba398d25-ef88-4762-bcd6-d75a2930fbeb" },
  { name: "Wedosport", id: "2de0e45d-1eda-4f15-a4d8-0076485b9545" },
  { name: "WILD TV", id: "43b08654-edb3-4757-9a53-4249b3f6ddfd" },
];

export default function QuickAccessTab() {
  const origin = window.location.origin;
  return (
    <div className="tab-content-container">
      <ul className="quick-access-list">
        {channels.map((c) => (
          <li key={c.id}>
            <button
              className="btn btn--primary quick-access-btn"
              onClick={() => {
                window.location.href = `${origin}/app?channelId=${c.id}`;
              }}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
