import React from "react";

export default function TweetsList({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleEnabled,
  onBumpSort,
}) {
  if (loading) return <div>Loading…</div>;
  if (!items || items.length === 0) return <div>No tweets found.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((row) => (
        <div
          key={row._id}
          style={{
            border: "1px solid #333",
            borderRadius: 8,
            padding: 12,
            background: "#0f172a",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, color: "#e5e7eb" }}>
              {row.authorName || row.authorHandle || "Unknown"} · {row.authorHandle || ""}
            </div>
            <div style={{ color: "#9ca3af", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.text || row.url}
            </div>
            <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 12 }}>
              Sections: {(row.sections || []).join(", ") || "—"} · Enabled: {row.enabled ? "Yes" : "No"} · Sort: {row.sortIndex ?? 0}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => onBumpSort(row._id, -10)} style={btnGrey}>↑</button>
            <button onClick={() => onBumpSort(row._id, +10)} style={btnGrey}>↓</button>
            <button onClick={() => onToggleEnabled(row._id, !row.enabled)} style={btnGrey}>
              {row.enabled ? "Disable" : "Enable"}
            </button>
            <a href={row.url} target="_blank" rel="noreferrer" style={btnGrey}>Open</a>
            <button onClick={() => onEdit(row)} style={btnBlue}>Edit</button>
            <button onClick={() => onDelete(row._id)} style={btnRed}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const btnGrey = {
  padding: "6px 10px",
  background: "#1f2937",
  color: "#fff",
  border: "1px solid #374151",
  borderRadius: 6,
  cursor: "pointer",
};

const btnBlue = { ...btnGrey, background: "#1d4ed8", borderColor: "#1e40af" };
const btnRed  = { ...btnGrey, background: "#991b1b", borderColor: "#7f1d1d" };
