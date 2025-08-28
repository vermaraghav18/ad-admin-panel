// src/pages/CartoonSectionEdit.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import Toggle from '../components/Toggle';
import { CartoonAPI } from '../api';

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  bannerImageUrl: '',
  isActive: true,
  placements: [{ target: 'home', afterNth: 5, repeatEvery: 0, enabled: true }],
};

const targets = ['home', 'news_hub', 'custom_news', 'any'];

export default function CartoonSectionEdit() {
  const { id } = useParams(); // "new" or actual id
  const creating = id === 'new';
  const nav = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!creating);

  useEffect(() => {
    if (!creating) {
      CartoonAPI.getSection(id).then((s) => {
        setForm({
          title: s.title,
          slug: s.slug,
          description: s.description || '',
          bannerImageUrl: s.bannerImageUrl || '',
          isActive: !!s.isActive,
          placements: s.placements?.length ? s.placements : emptyForm.placements,
        });
        setItems((s.items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, creating]);

  const save = async () => {
    if (creating) {
      const created = await CartoonAPI.createSection(form);
      nav(`/cartoons/${created._id}`, { replace: true });
    } else {
      await CartoonAPI.updateSection(id, form);
      alert('Saved');
    }
  };

  const addPlacement = () => {
    setForm((f) => ({ ...f, placements: [...(f.placements || []), { target: 'home', afterNth: 5, repeatEvery: 0, enabled: true }] }));
  };
  const removePlacement = (idx) => {
    setForm((f) => {
      const next = [...(f.placements || [])];
      next.splice(idx, 1);
      return { ...f, placements: next };
    });
  };

  const addItem = async () => {
    if (creating) {
      alert('Save section first, then add images.');
      return;
    }
    const imageUrl = window.prompt('Paste image URL (Cloudinary/CDN)');
    if (!imageUrl) return;
    const body = { imageUrl, caption: '', credit: '', order: items.length, isActive: true };
    const updated = await CartoonAPI.addItem(id, body);
    setItems((updated.items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  };

  const updateItem = async (it, patch) => {
    await CartoonAPI.updateItem(it._id, patch);
    setItems((prev) =>
      prev.map((p) => (p._id === it._id ? { ...p, ...patch } : p)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
  };

  const deleteItem = async (it) => {
    if (!window.confirm('Delete this image?')) return;
    await CartoonAPI.deleteItem(it._id);
    setItems((prev) => prev.filter((p) => p._id !== it._id));
  };

  const saveOrder = async () => {
    const orderArr = items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((i) => i._id);
    await CartoonAPI.reorderItems(id, orderArr);
    alert('Order saved');
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{creating ? 'New Cartoon Section' : 'Edit Cartoon Section'}</h1>
        <button onClick={save} className="px-4 py-2 rounded bg-black text-white">Save</button>
      </div>

      {/* Basics */}
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Title">
          <input className="w-full border rounded px-3 py-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Slug" hint="Unique ID like satire-set-1">
          <input className="w-full border rounded px-3 py-2" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <textarea className="w-full border rounded px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Banner (4:16) URL" hint="Shown in the scroll feed">
          <input className="w-full border rounded px-3 py-2" value={form.bannerImageUrl} onChange={(e) => setForm({ ...form, bannerImageUrl: e.target.value })} />
        </Field>
        <div className="flex items-end">
          <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" />
        </div>
      </div>

      {/* Placements */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Placements</h2>
          <button onClick={addPlacement} className="px-3 py-1 border rounded">Add</button>
        </div>
        <div className="grid gap-3">
          {(form.placements || []).map((p, idx) => (
            <div key={idx} className="border rounded p-3 grid md:grid-cols-5 gap-3">
              <select
                className="border rounded px-2 py-1"
                value={p.target}
                onChange={(e) => {
                  const v = e.target.value;
                  const next = [...form.placements];
                  next[idx] = { ...p, target: v };
                  setForm({ ...form, placements: next });
                }}
              >
                {targets.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600">after Nth</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-24"
                  value={p.afterNth}
                  onChange={(e) => {
                    const next = [...form.placements];
                    next[idx] = { ...p, afterNth: parseInt(e.target.value || '0', 10) };
                    setForm({ ...form, placements: next });
                  }}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600">repeat every</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-24"
                  value={p.repeatEvery || 0}
                  onChange={(e) => {
                    const next = [...form.placements];
                    next[idx] = { ...p, repeatEvery: parseInt(e.target.value || '0', 10) };
                    setForm({ ...form, placements: next });
                  }}
                />
              </label>

              <Toggle
                checked={p.enabled}
                onChange={(v) => {
                  const next = [...form.placements];
                  next[idx] = { ...p, enabled: v };
                  setForm({ ...form, placements: next });
                }}
                label="Enabled"
              />

              <button className="text-red-600" onClick={() => removePlacement(idx)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      {!creating && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Images</h2>
            <div className="flex gap-2">
              <button onClick={addItem} className="px-3 py-1 border rounded">Add image (URL)</button>
              <button onClick={saveOrder} className="px-3 py-1 border rounded">Save order</button>
            </div>
          </div>

          <div className="grid gap-3">
            {items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((it, i) => (
              <div key={it._id} className="border rounded p-3 grid md:grid-cols-5 gap-3 items-center">
                <img src={it.imageUrl} alt="" className="h-16 object-contain md:col-span-1" />
                <input
                  className="border rounded px-2 py-1 md:col-span-2"
                  placeholder="Caption"
                  value={it.caption || ''}
                  onChange={(e) => updateItem(it, { caption: e.target.value })}
                />
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Credit"
                  value={it.credit || ''}
                  onChange={(e) => updateItem(it, { credit: e.target.value })}
                />

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">order</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20"
                    value={it.order ?? 0}
                    onChange={(e) => {
                      const newOrder = parseInt(e.target.value || '0', 10);
                      setItems((prev) => prev.map((p) => (p._id === it._id ? { ...p, order: newOrder } : p)));
                    }}
                  />
                  <Toggle
                    checked={!!it.isActive}
                    onChange={(v) => updateItem(it, { isActive: v })}
                    label="active"
                  />
                  <button onClick={() => deleteItem(it)} className="text-red-600">delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
