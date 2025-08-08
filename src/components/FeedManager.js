import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FeedManager = () => {
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({
    label: '',
    url: '',
    language: 'en',
    category: '',
    state: '',
    city: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // ✅ Use env first; fallback to Render URL
  const API_BASE =
    (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com') +
    '/api/feeds';

  const fetchFeeds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/all`);
      setFeeds(res.data);
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
      alert('Could not load feeds from server.');
    }
  };

  useEffect(() => {
    fetchFeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddFeed = async () => {
    if (!newFeed.label || !newFeed.url) {
      alert('Label and URL are required');
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(API_BASE, newFeed);
      setNewFeed({
        label: '',
        url: '',
        language: 'en',
        category: '',
        state: '',
        city: '',
      });
      fetchFeeds();
    } catch (err) {
      console.error('Error adding feed:', err);
      alert('Failed to add feed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFeed = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feed?')) return;

    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchFeeds();
    } catch (err) {
      console.error('Error deleting feed:', err);
      alert('Failed to delete feed.');
    }
  };

  const handleToggleEnabled = async (id, currentStatus) => {
    try {
      await axios.put(`${API_BASE}/${id}`, { enabled: !currentStatus });
      fetchFeeds();
    } catch (err) {
      console.error('Error toggling feed:', err);
      alert('Failed to update feed.');
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">📰 RSS Feed Manager</h2>

      <div className="bg-gray-800 p-4 rounded mb-6">
        <h3 className="text-lg font-semibold mb-2">Add New Feed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Label (e.g., Top News)"
            className="p-2 bg-gray-700 rounded"
            value={newFeed.label}
            onChange={(e) => setNewFeed({ ...newFeed, label: e.target.value })}
          />
          <input
            type="text"
            placeholder="Feed URL"
            className="p-2 bg-gray-700 rounded"
            value={newFeed.url}
            onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
          />
          <input
            type="text"
            placeholder="Language (e.g., en, hi)"
            className="p-2 bg-gray-700 rounded"
            value={newFeed.language}
            onChange={(e) =>
              setNewFeed({ ...newFeed, language: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Category (optional)"
            className="p-2 bg-gray-700 rounded"
            value={newFeed.category}
            onChange={(e) =>
              setNewFeed({ ...newFeed, category: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="State (optional)"
            className="p-2 bg-gray-700 rounded"
            value={newFeed.state}
            onChange={(e) =>
              setNewFeed({ ...newFeed, state: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="City (optional)"
            className="p-2 bg-gray-700 rounded"
            value={newFeed.city}
            onChange={(e) => setNewFeed({ ...newFeed, city: e.target.value })}
          />
        </div>
        <button
          onClick={handleAddFeed}
          disabled={isLoading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          {isLoading ? 'Adding...' : 'Add Feed'}
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">Existing Feeds</h3>
      {feeds.length === 0 ? (
        <p className="text-gray-400">No feeds found.</p>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => (
            <div
              key={feed._id}
              className="bg-gray-800 p-4 rounded flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <p className="font-bold">{feed.label}</p>
                <p className="text-sm text-gray-400">{feed.url}</p>
                <p className="text-sm text-gray-400">
                  Lang: {feed.language} | Category: {feed.category || '—'}
                </p>
                <p className="text-sm text-gray-400">
                  State: {feed.state || '—'} | City: {feed.city || '—'}
                </p>
              </div>
              <div className="mt-2 md:mt-0 flex gap-2">
                <button
                  onClick={() => handleToggleEnabled(feed._id, feed.enabled)}
                  className={`px-3 py-1 rounded ${
                    feed.enabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {feed.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDeleteFeed(feed._id)}
                  className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedManager;
