import React, { useEffect, useState } from 'react';
import { CartoonApi } from '../services/cartoonApi';

export default function CartoonSectionEdit({ params }) {
  const id = params?.id; // from your router
  const isNew = id === 'new';
  const [model, setModel] = useState({
    title: '', sectionKey: '', scopeType: 'global', scopeValue: '',
    placement: 'both',
    injection: { afterNth: 5, repeatEvery: 0, repeatCount: 0 },
    enabled: true, sortIndex: 0,
  });

  useEffect(() => {
    (async () => {
      if (!isNew) {
        const list = await CartoonApi.getSections();
        const found = list.find(s => s._id === id);
        if (found) setModel(found);
      }
    })();
  }, [id, isNew]);

  const save = async () => {
    if (isNew) await CartoonApi.createSection(model);
    else await CartoonApi.updateSection(id, model);
    window.location.hash = '#/cartoons/sections';
  };

  return (
    <div className="p-4">
      <h2>{isNew ? 'New' : 'Edit'} Cartoon Section</h2>
      <div className="grid" style={{gridTemplateColumns:'200px 1fr', gap:12}}>
        <label>Title</label>
        <input value={model.title} onChange={e=>setModel({...model,title:e.target.value})} />

        <label>Scope Type</label>
        <select value={model.scopeType} onChange={e=>setModel({...model,scopeType:e.target.value})}>
          <option value="global">global</option>
          <option value="category">category</option>
          <option value="state">state</option>
          <option value="city">city</option>
        </select>

        <label>Scope Value</label>
        <input value={model.scopeValue||''} onChange={e=>setModel({...model,scopeValue:e.target.value})} placeholder="Top News / Delhi / Mumbai" />

        <label>Placement</label>
        <select value={model.placement} onChange={e=>setModel({...model,placement:e.target.value})}>
          <option>both</option><option>scroll</option><option>swipe</option>
        </select>

        <label>Injection</label>
        <div>
          afterNth: <input type="number" value={model.injection.afterNth}
            onChange={e=>setModel({...model,injection:{...model.injection,afterNth:+e.target.value}})} style={{width:90}} />
          &nbsp; every: <input type="number" value={model.injection.repeatEvery}
            onChange={e=>setModel({...model,injection:{...model.injection,repeatEvery:+e.target.value}})} style={{width:90}} />
          &nbsp; count: <input type="number" value={model.injection.repeatCount}
            onChange={e=>setModel({...model,injection:{...model.injection,repeatCount:+e.target.value}})} style={{width:90}} />
        </div>

        <label>Enabled</label>
        <input type="checkbox" checked={!!model.enabled} onChange={e=>setModel({...model,enabled:e.target.checked})} />

        <label>Sort Index</label>
        <input type="number" value={model.sortIndex} onChange={e=>setModel({...model,sortIndex:+e.target.value})} />
      </div>

      <div className="mt-3">
        <button className="btn btn-primary" onClick={save}>Save</button>{' '}
        <a className="btn" href="#/cartoons/sections">Cancel</a>
      </div>
    </div>
  );
}
