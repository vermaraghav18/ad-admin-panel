import React, { useEffect, useState } from 'react';
import CustomNewsForm from '../components/CustomNewsForm';

export default function CustomNewsManagerPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const res = await fetch('/api/custom-news');
    setItems(await res.json());
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4">
      <h1>Custom News</h1>
      <CustomNewsForm onSaved={load} />
      <hr className="my-6"/>
      <h2 className="mb-2">Existing</h2>
      <ul className="space-y-3">
        {items.map(it => (
          <li key={it._id} className="border p-3 rounded">
            <div className="flex gap-3">
              <img src={it.imageUrl} alt="" width={96} height={96} style={{objectFit:'cover'}}/>
              <div>
                <div className="font-semibold">{it.title}</div>
                <div className="text-sm opacity-80">{it.source}</div>
                <div className="text-sm">{it.description}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
