import React from 'react';

export default function NewsPreviewCard({ imageUrl, title, description, source }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {imageUrl ? (
        <img src={imageUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 160, background: '#eee' }} />
      )}
      <div style={{ height: 4, background: '#2f80ed' }} />
      <div className="p-3">
        <div style={{ fontSize: 12, opacity: 0.7 }}>{source || 'source'}</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>{title || 'Title'}</div>
        <div style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>
          {description || 'Description will appear here.'}
        </div>
      </div>
    </div>
  );
}
