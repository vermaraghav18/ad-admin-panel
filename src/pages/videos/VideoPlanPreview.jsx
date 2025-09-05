// admin/src/pages/videos/VideoPlanPreview.jsx
import React, { useState } from 'react';
import { getPlan } from '../../services/videosApi';

export default function VideoPlanPreview() {
  const [form, setForm] = useState({ sectionType: 'global', sectionValue: '', mode: 'scroll' });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await getPlan(form);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const renderSlots = (p) => {
    const a = Number(p.afterNth || 0);
    const n = Number(p.repeatEvery || 0);
    const c = Number(p.repeatCount || 0);
    if (!a) return '—';
    const slots = [a, ...Array.from({ length: c }, (_, i) => a + n * (i + 1))];
    return slots.map(s => `#${s}`).join(', ');
  };

  return (
    <div className="page">
      <h2>Video Plan Preview</h2>
      <div style={{display:'flex', gap:'16px', alignItems:'flex-end'}}>
        <div>
          <label>Section Type</label><br/>
          <select name="sectionType" value={form.sectionType} onChange={onChange}>
            <option value="global">global</option>
            <option value="category">category</option>
            <option value="state">state</option>
            <option value="city">city</option>
          </select>
        </div>
        <div>
          <label>Section Value</label><br/>
          <input name="sectionValue" value={form.sectionValue} onChange={onChange} placeholder="e.g., top, finance, MH, mumbai" />
        </div>
        <div>
          <label>Mode</label><br/>
          <select name="mode" value={form.mode} onChange={onChange}>
            <option value="scroll">scroll</option>
            <option value="swipe">swipe</option>
          </select>
        </div>
        <button onClick={fetchPlan} disabled={loading}>{loading ? 'Loading…' : 'Preview'}</button>
      </div>

      <div style={{marginTop:16}}>
        {rows.length === 0 ? <p>No plan items.</p> : (
          <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th>Section</th>
                <th>Scope</th>
                <th>Placement</th>
                <th>Injection</th>
                <th>Sort</th>
                <th>Slots</th>
              </tr>
            </thead>
            <tbody>
            {rows.map((p, i) => (
              <tr key={i}>
                <td>{p.title}</td>
                <td>{p.scopeType}{p.scopeType!=='global' ? `:${p.scopeValue}` : ''}</td>
                <td>{p.placement}</td>
                <td>after {p.afterNth} • every {p.repeatEvery} • x{p.repeatCount}</td>
                <td>{p.sortIndex ?? 0}</td>
                <td>{renderSlots(p)}</td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
