import React, { useState } from 'react';
import NewsPreviewCard from './NewsPreviewCard';

const isUrl = (s='') => /^https?:\/\/\S+/i.test(s);

export default function CustomNewsForm({ onSaved, initial }) {
  const [mode, setMode] = useState('manual'); // 'manual' | 'link'
  const [linkUrl, setLinkUrl] = useState('');

  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [source, setSource] = useState(initial?.source || '');
  const [image, setImage] = useState(null);            // file upload (manual override)
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || ''); // from link extract

  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  const resetManualFields = () => {
    setTitle(''); setDescription(''); setSource(''); setImage(null); setImageUrl('');
  };

  const handleExtract = async () => {
    setError('');
    if (!isUrl(linkUrl)) { setError('Please enter a valid http(s) URL.'); return; }
    try {
      setExtracting(true);
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract');
      // Populate fields; allow user edits
      setTitle(data.title || '');
      setDescription(data.description || '');
      setSource(data.source || '');
      setImageUrl(data.imageUrl || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setExtracting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('source', source);

      // If user uploaded an image file, prefer it; otherwise use extracted imageUrl
      if (image) form.append('image', image);
      else if (imageUrl) form.append('imageUrl', imageUrl);

      // Optionally persist original link
      if (linkUrl) form.append('link', linkUrl);

      const method = initial?._id ? 'PUT' : 'POST';
      const url = initial?._id ? `/api/custom-news/${initial._id}` : '/api/custom-news';

      const res = await fetch(url, { method, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSaved?.(data);
      if (!initial) {
        resetManualFields();
        setLinkUrl('');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-3 items-center">
        <label>
          <input
            type="radio"
            name="mode"
            value="manual"
            checked={mode === 'manual'}
            onChange={() => setMode('manual')}
          />{' '}
          Manual Entry
        </label>
        <label title="Paste a normal article link OR an RSS/Atom XML feed link. We'll auto-fill fields.">
          <input
            type="radio"
            name="mode"
            value="link"
            checked={mode === 'link'}
            onChange={() => setMode('link')}
          />{' '}
          Link Entry (Normal or XML)
        </label>
      </div>

      {/* Link entry UI */}
      {mode === 'link' && (
        <div className="p-3 border rounded">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/article OR https://example.com/feed.xml"
              className="input"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              title="Paste a public article URL or an RSS/Atom XML feed URL."
              required
            />
            <button type="button" className="btn" onClick={handleExtract} disabled={extracting}>
              {extracting ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          <p className="text-sm opacity-70 mt-2">
            Tip: We’ll read OpenGraph/Meta tags for web pages, or the first item from the RSS/Atom feed. You can edit anything before saving.
          </p>
        </div>
      )}

      {/* Manual fields (also editable after link fetch) */}
      <input
        type="text"
        className="input"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="textarea"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        required
      />
      <input
        type="text"
        className="input"
        placeholder="Source (e.g., domain.com)"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        required
        title="Source shown on the card (usually the domain or publication name)."
      />

      {/* Image: either upload or use extracted imageUrl */}
      <div className="flex flex-col gap-2">
        <label className="text-sm">
          Image Upload (optional) — overrides extracted image URL if provided
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        {!image && (
          <input
            type="url"
            className="input"
            placeholder="Or provide Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        )}
      </div>

      {/* Live preview */}
      <div>
        <div className="text-sm mb-2">Preview</div>
        <NewsPreviewCard
          imageUrl={image ? URL.createObjectURL(image) : imageUrl}
          title={title}
          description={description}
          source={source}
        />
      </div>

      <button className="btn" disabled={saving}>
        {saving ? 'Saving…' : (initial?._id ? 'Update' : 'Save')}
      </button>
    </form>
  );
}
