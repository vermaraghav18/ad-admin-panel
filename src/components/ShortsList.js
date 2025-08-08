// ad-admin-panel/src/components/ShortsList.js
import React from "react";

export default function ShortsList({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleEnabled,
  onBumpSort,
}) {
  if (loading) return <div>Loading…</div>;
  if (!items || items.length === 0) return <div>No shorts found.</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th style={{ padding: 8 }}>Enabled</th>
            <th style={{ padding: 8 }}>Source</th>
            <th style={{ padding: 8 }}>URL</th>
            <th style={{ padding: 8 }}>Sections</th>
            <th style={{ padding: 8 }}>Sort</th>
            <th style={{ padding: 8 }}>Inject N</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row._id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: 8 }}>
                <input
                  type="checkbox"
                  checked={!!row.enabled}
                  onChange={(e) => onToggleEnabled(row._id, e.target.checked)}
                  title="Enable/Disable"
                />
              </td>
              <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {row.thumbnailUrl ? (
                    <img
                      src={row.thumbnailUrl}
                      alt=""
                      style={{ width: 64, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid #333" }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 36, background: "#222", borderRadius: 4 }} />
                  )}
                  <div>{row.sourceName || "-"}</div>
                </div>
              </td>
              <td style={{ padding: 8, maxWidth: 380, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <a href={row.url} target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>
                  {row.url}
                </a>
              </td>
              <td style={{ padding: 8 }}>
                {(row.sections || []).join(", ") || "-"}
              </td>
              <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => onBumpSort(row._id, -1)}
                    title="Decrease sortIndex"
                    style={{ padding: "4px 8px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 24, textAlign: "center" }}>{row.sortIndex ?? 0}</span>
                  <button
                    onClick={() => onBumpSort(row._id, +1)}
                    title="Increase sortIndex"
                    style={{ padding: "4px 8px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </td>
              <td style={{ padding: 8 }}>{row.injectEveryNCards ?? 5}</td>
              <td style={{ padding: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onEdit(row)}
                    style={{ padding: "6px 10px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(row._id)}
                    style={{ padding: "6px 10px", border: "1px solid #7f1d1d", background: "#991b1b", color: "#fff", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
