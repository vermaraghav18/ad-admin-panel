import React, { useEffect, useMemo, useState } from 'react';
import { CartoonApi } from '../services/cartoonApi';

const empty = {
  sectionId: '', title: '', caption: '', credit: '',
  tags: [], status: 'live', publishedAt: '', expiresAt: '',
  schedule: { daysOfWeek: [], startTime: '', endTime: '' },
  variants: [{ aspect:'16:9', url:'' }],
};

export default function CartoonEdit({ params, query }) {
  const id = params?.id;
  const isNew = id === 'new';
  const [model, setModel] = useState(empty);
  const [sections, setSections] = useState([]);
  const qSection = query?.sectionId || '';

  useEffect(() => {
    (async () => {
      const s = await CartoonApi.getSections();
      setSections(s);
      if (isNew) {
        setModel(m => ({...m, sectionId: qSection || (s[0]?._id || '')}));
      } else {
        const all = await CartoonApi.getEntries();
        const found = all.find(x => x._id === id);
        if (found) {
          setModel({
            ...empty,
            ...found,
            publishedAt: found.publishedAt ? found.publishedAt.slice(0,16) : '',
            expiresAt:   found.expiresAt ?   found.expiresAt.slice(0,16) : '',
          });
        }
      }
    })();
  }, [id, isNew, qSection]);

  const save = async () => {
    const payload = {
      ...model,
      publishedAt: model.publishedAt ? new Date(model.publishedAt).toISOString() : null,
      expiresAt:   model.expiresAt ?   new Date(model.expiresAt).toISOString()   : null,
    };
    if (isNew) await CartoonApi.createEntry(payload);
    else await CartoonApi.updateEntry(id, payload);
    window.location.hash = `#/cartoons/entries?sectionId=${payload.sectionId}`;
  };

  const toggleDay = (d) => {
    const cur = new Set(model.schedule.daysOfWeek || []);
    cur.has(d) ? cur.delete(d) : cur.add(d);
    setModel({...model, schedule: {...model.schedule, daysOfWeek: Array.from(cur).sort()}});
  };

  const addVariant = () => setModel({...model, variants:[...model.variants, { aspect:'16:9', url:'' }]});
  const rmVariant = (i) => setModel({...model, variants:model.variants.filter((_,idx)=>idx!==i)});

  const sectionOptions = useMemo(()=>sections.map(s => <option key={s._id} value={s._id}>{s.title}</option>), [sections]);

  return (
    <div className="p-4">
      <h2>{isNew ? 'New' : 'Edit'} Cartoon Entry</h2>

      <div className="grid" style={{gridTemplateColumns:'200px 1fr', gap:12}}>
        <label>Section</label>
        <select value={model.sectionId} onChange={e=>setModel({...model,sectionId:e.target.value})}>
          {sectionOptions}
        </select>

        <label>Title</label>
        <input value={model.title} onChange={e=>setModel({...model,title:e.target.value})} />

        <label>Caption</label>
        <input value={model.caption} onChange={e=>setModel({...model,caption:e.target.value})} />

        <label>Credit</label>
        <input value={model.credit} onChange={e=>setModel({...model,credit:e.target.value})} />

        <label>Status</label>
        <select value={model.status} onChange={e=>setModel({...model,status:e.target.value})}>
          <option>live</option><option>draft</option>
        </select>

        <label>Published At</label>
        <input type="datetime-local" value={model.publishedAt} onChange={e=>setModel({...model,publishedAt:e.target.value})} />

        <label>Expires At</label>
        <input type="datetime-local" value={model.expiresAt} onChange={e=>setModel({...model,expiresAt:e.target.value})} />

        <label>Schedule (days)</label>
        <div>
          {[1,2,3,4,5,6,7].map(d=>(
            <label key={d} style={{marginRight:8}}>
              <input type="checkbox" checked={model.schedule.daysOfWeek?.includes(d)||false}
                     onChange={()=>toggleDay(d)} /> {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d-1]}
            </label>
          ))}
        </div>

        <label>Start–End (HH:mm)</label>
        <div>
          <input placeholder="18:00" value={model.schedule.startTime||''}
                 onChange={e=>setModel({...model, schedule:{...model.schedule, startTime:e.target.value}})} style={{width:120}} />
          {' '}to{' '}
          <input placeholder="22:00" value={model.schedule.endTime||''}
                 onChange={e=>setModel({...model, schedule:{...model.schedule, endTime:e.target.value}})} style={{width:120}} />
        </div>

        <label>Variants</label>
        <div>
          {model.variants.map((v,i)=>(
            <div key={i} style={{display:'flex', gap:8, marginBottom:8}}>
              <select value={v.aspect} onChange={e=>{
                const arr=[...model.variants]; arr[i]={...v, aspect:e.target.value}; setModel({...model,variants:arr});
              }}>
                <option>16:9</option><option>9:16</option><option>4:16</option><option>1:1</option>
              </select>
              <input placeholder="https://..." value={v.url} onChange={e=>{
                const arr=[...model.variants]; arr[i]={...v, url:e.target.value}; setModel({...model,variants:arr});
              }} style={{flex:1}} />
              <button className="btn btn-sm btn-outline-danger" onClick={()=>rmVariant(i)}>Remove</button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline-secondary" onClick={addVariant}>+ Add Variant</button>
        </div>
      </div>

      <div className="mt-3">
        <button className="btn btn-primary" onClick={save}>Save</button>{' '}
        <a className="btn" href={`#/cartoons/entries?sectionId=${model.sectionId}`}>Cancel</a>
      </div>
    </div>
  );
}
