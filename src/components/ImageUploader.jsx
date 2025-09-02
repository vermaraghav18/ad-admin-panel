// src/components/ImageUploader.jsx
import React, { useRef, useState } from 'react';
import { uploadImage } from '../services/spotlight2Service';

export default function ImageUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const res = await uploadImage(f);
      onChange?.(res.url || res.secure_url || '');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input
        type="text"
        placeholder="Paste Cloudinary or public image URL"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} disabled={busy} />
        {busy ? <span>Uploading…</span> : null}
      </div>
      {value ? (
        <img src={value} alt="preview" style={{ maxWidth: 280, borderRadius: 8, border: '1px solid #eee' }} />
      ) : null}
    </div>
  );
}
