import React, { useState } from 'react';

export default function CustomNewsForm({ onSaved, initial }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [source, setSource] = useState(initial?.source || '');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('source', source);
    if (image) form.append('image', image);

    const method = initial?._id ? 'PUT' : 'POST';
    const url = initial?._id ? `/api/custom-news/${initial._id}` : '/api/custom-news';

    const res = await fetch(url, { method, body: form });
    const data = await res.json();
    setSaving(false);
    onSaved?.(data);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="text" className="input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required/>
      <textarea className="textarea" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} required/>
      <input type="text" className="input" placeholder="Source" value={source} onChange={e=>setSource(e.target.value)} required/>
      <input type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])}/>
      <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
