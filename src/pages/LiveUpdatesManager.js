import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://ad-server-qx62.onrender.com";

export default function LiveUpdatesManager() {
  const [topics, setTopics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [entry, setEntry] = useState({
    summary: "",
    imageUrl: "",
    sourceName: "",
    linkUrl: "",
  });

  /* ---------------- Fetch Topics ---------------- */
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/live/topics`);
      setTopics(res.data);
      if (res.data.length && !selectedTopic) {
        setSelectedTopic(res.data[0]._id);
        fetchEntries(res.data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching topics", err);
    }
  };

  const createTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      await axios.post(`${API_BASE}/live/topics`, { title: newTopic });
      setNewTopic("");
      fetchTopics();
    } catch (err) {
      console.error("Error creating topic", err);
    }
  };

  /* ---------------- Entries ---------------- */
  const fetchEntries = async (topicId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/live/entries?topicId=${topicId}`
      );
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching entries", err);
    }
  };

  const createEntry = async () => {
    if (!selectedTopic || !entry.summary.trim()) return;
    try {
      await axios.post(`${API_BASE}/live/entries`, {
        topicId: selectedTopic,
        ...entry,
      });
      setEntry({ summary: "", imageUrl: "", sourceName: "", linkUrl: "" });
      fetchEntries(selectedTopic);
    } catch (err) {
      console.error("Error creating entry", err);
    }
  };

  /* ---------------- JSX ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>📡 Live Updates Manager</h2>

      {/* Topic Section */}
      <div style={{ marginBottom: 30 }}>
        <h3>Create Topic</h3>
        <input
          type="text"
          value={newTopic}
          placeholder="Topic title"
          onChange={(e) => setNewTopic(e.target.value)}
        />
        <button onClick={createTopic}>Add Topic</button>
      </div>

      {/* Topics Dropdown */}
      <div style={{ marginBottom: 30 }}>
        <h3>Topics</h3>
        <select
          value={selectedTopic || ""}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            fetchEntries(e.target.value);
          }}
        >
          {topics.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title} {t.isActive ? "(Active)" : "(Inactive)"}
            </option>
          ))}
        </select>
      </div>

      {/* Entries Section */}
      {selectedTopic && (
        <div>
          <h3>Create Entry</h3>
          <input
            type="text"
            placeholder="Summary"
            value={entry.summary}
            onChange={(e) => setEntry({ ...entry, summary: e.target.value })}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={entry.imageUrl}
            onChange={(e) => setEntry({ ...entry, imageUrl: e.target.value })}
          />
          <input
            type="text"
            placeholder="Source Name"
            value={entry.sourceName}
            onChange={(e) => setEntry({ ...entry, sourceName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Link URL"
            value={entry.linkUrl}
            onChange={(e) => setEntry({ ...entry, linkUrl: e.target.value })}
          />
          <button onClick={createEntry}>Add Entry</button>

          <h3 style={{ marginTop: 20 }}>Entries</h3>
          <ul>
            {entries.map((e) => (
              <li key={e._id}>
                <strong>{e.summary}</strong> – {e.sourceName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
