import React, { useEffect, useMemo, useState } from "react";

export default function TweetForm({
  baseSections = [],
  initialValue = null,
  onSubmit,
  onCancel,
}) {
  const [url, setUrl] = useState("");
  const [sections, setSections] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [sortIndex, setSortIndex] = useState(0);
  const [showInNews, setShowInNews] = useState(true);
  const [injectEveryNCards, setInjectEveryNCards] = useState(5);

  const [authorName, setAuthorName] = useState("");
  const [authorHandle, setAuthorHandle] = useState("");
  const [text, setText] = useState("");

  const safeSubmit = useMemo(() => (typeof onSubmit === "function" ? onSubmit : () => {}), [onSubmit]);
  const safeCancel = useMemo(() => (typeof onCancel === "function" ? onCancel : () => {}), [onCancel]);

  const isEdit = useMemo(() => !!initialValue, [initialValue]);

  useEffect(() => {
    if (initialValue) {
      setUrl(initialValue.url || "");
      setSections(initialValue.sections || []);
      setEnabled(initialValue.enabled ?? true);
      setSortIndex(initialValue.sortIndex ?? 0);
      setShowInNews(initialValue.showInNews ?? true);
      setInjectEveryNCards(initialValue.injectEveryNCards ?? 5);
      setAuthorName(initialValue.authorName || "");
      setAuthorHandle(initialValue.authorHandle || "");
      setText(initialValue.text || "");
    }
  }, [initialValue]);

  const toggleSection = (s) => {
    setSections((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : prev.concat(s)));
  };

  const [customSection, setCustomSection] = useState("");
  const addCustomSection = () => {
    const v = customSection.trim();
    if (!v) return;
    if (!sections.includes(v)) setSections((prev) => prev.concat(v));
    setCustomSection("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      alert("Please provide the Tweet URL.");
      return;
    }
    safeSubmit({
      url: url.trim(),
      sections,
      enabled,
      sortIndex: Number(sortIndex) || 0,
      showInNews,
      injectEveryNCards: Number(injectEveryNCards) || 5,
      authorName: authorName.trim(),
      authorHandle: authorHandle.trim(),
      text: text.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Tweet URL *</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://x.com/handle/status/1234567890"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Author (optional)</span>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Handle (optional)</span>
          <input
            type="text"
            value={authorHandle}
            onChange={(e) => setAuthorHandle(e.target.value)}
            placeholder="@handle"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Text (optional)</span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tweet text excerpt"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Sort Index</span>
          <input
            type="number"
            value={sortIndex}
            onChange={(e) => setSortIndex(e.target.value)}
            placeholder="0"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Inject Every N Cards (News)</span>
          <input
            type="number"
            value={injectEveryNCards}
            onChange={(e) => setInjectEveryNCards(e.target.value)}
            placeholder="5"
            min="1"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
        </label>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>Enabled</span>
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={showInNews} onChange={(e) => setShowInNews(e.target.checked)} />
            <span>Show in News</span>
          </label>
        </div>
      </div>

      {/* Section selector */}
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 6 }}>Sections (where to show)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {baseSections.map((s) => {
            const active = sections.includes(s);
            return (
              <button
                type="button"
                key={s}
                onClick={() => toggleSection(s)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #333",
                  background: active ? "#334155" : "#1f2937",
                  color: "#fff",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
                title={active ? "Click to remove" : "Click to add"}
              >
                {active ? "✓ " : ""}{s}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            type="text"
            value={customSection}
            onChange={(e) => setCustomSection(e.target.value)}
            placeholder="Add custom section (press +)"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333", flex: 1 }}
          />
          <button
            type="button"
            onClick={addCustomSection}
            style={{ padding: "6px 12px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          style={{ padding: "8px 12px", border: "1px solid #333", background: "#16a34a", color: "#fff", cursor: "pointer" }}
        >
          {isEdit ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={safeCancel}
          style={{ padding: "8px 12px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
