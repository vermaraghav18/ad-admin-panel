// admin/src/pages/videos/VideoEntryForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { entrySchema } from '../../validation/videoSchemas';
import { listEntries, getSection, createEntry, updateEntry } from '../../services/videosApi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const initial = (sectionId) => ({
  sectionId: sectionId || '',
  hlsUrl: '',
  mp4Url: '',
  posterUrl: '',
  autoplay: true,
  startMuted: true,
  loop: false,
  pipAllowed: true,
  durationSec: 0,
  aspect: '16:9',
  caption: '',
  credit: '',
  tags: [],
  subtitleUrl: '',
  subtitleLang: '',
  status: 'live',
  publishedAt: '',
  expiresAt: '',
  schedule: { daysOfWeek: [], startTime: '', endTime: '' },
});

export default function VideoEntryForm() {
  // IMPORTANT:
  // - Create route: /admin/videos/sections/:id/entries/new   -> :id is SECTION ID
  // - Edit route:   /admin/videos/entries/:id/edit?sectionId=... -> :id is ENTRY ID
  const { id } = useParams();
  const location = useLocation();
  const q = useQuery();
  const nav = useNavigate();

  const creating = location.pathname.endsWith('/new'); // true on create screen
  const sectionId = creating ? id : (q.get('sectionId') || ''); // sectionId from route (create) or query (edit)
  const entryId = creating ? '' : id; // entry id only on edit

  const [seed, setSeed] = useState(initial(sectionId));
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(!creating); // only load on edit

  // Load section meta (for header) when we know the sectionId
  useEffect(() => {
    const run = async () => {
      if (!sectionId) return;
      const data = await getSection(sectionId);
      setSection(data?.section || null);
    };
    run();
  }, [sectionId]);

  // Load existing entry when editing
  useEffect(() => {
    const load = async () => {
      if (creating) return;
      if (!sectionId || !entryId) return; // we need both to find the entry
      setLoading(true);

      // No GET /entries/:id endpoint, so fetch entries in this section and find the matching one
      const list = await listEntries(sectionId);
      const e = (list || []).find(x => x._id === entryId);
      if (e) {
        setSeed({
          sectionId: e.sectionId,
          hlsUrl: e.hlsUrl || '',
          mp4Url: e.mp4Url || '',
          posterUrl: e.posterUrl || '',
          autoplay: !!e.autoplay,
          startMuted: !!e.startMuted,
          loop: !!e.loop,
          pipAllowed: !!e.pipAllowed,
          durationSec: e.durationSec ?? 0,
          aspect: e.aspect || '16:9',
          caption: e.caption || '',
          credit: e.credit || '',
          tags: Array.isArray(e.tags) ? e.tags : [],
          subtitleUrl: e.subtitleUrl || '',
          subtitleLang: e.subtitleLang || '',
          status: e.status || 'live',
          publishedAt: e.publishedAt ? new Date(e.publishedAt).toISOString().slice(0,16) : '',
          expiresAt: e.expiresAt ? new Date(e.expiresAt).toISOString().slice(0,16) : '',
          schedule: {
            daysOfWeek: e.schedule?.daysOfWeek || [],
            startTime: e.schedule?.startTime || '',
            endTime: e.schedule?.endTime || '',
          },
        });
      }
      setLoading(false);
    };
    load();
  }, [creating, sectionId, entryId]);

  const onSubmit = async (values, { setSubmitting, setFieldTouched }) => {
    try {
      // Minimal guard to avoid silent non-submit if sectionId missing (shouldn’t happen now)
      if (!values.sectionId) {
        setFieldTouched('sectionId', true, false);
        setSubmitting(false);
        return;
      }

      const payload = {
        ...values,
        // ensure arrays are arrays
        tags: Array.isArray(values.tags) ? values.tags : [],
        schedule: {
          daysOfWeek: Array.isArray(values.schedule?.daysOfWeek) ? values.schedule.daysOfWeek : [],
          startTime: values.schedule?.startTime || '',
          endTime: values.schedule?.endTime || '',
        },
        // coerce date-time-local back to ISO strings
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      };

      if (creating) {
        await createEntry(payload);
      } else {
        await updateEntry(entryId, payload);
      }
      nav(`/admin/videos/sections/${values.sectionId}/entries`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!creating && loading) return <p>Loading…</p>;

  const toggleTag = (values, setFieldValue, tag) => {
    const now = new Set(values.tags || []);
    if (now.has(tag)) now.delete(tag); else now.add(tag);
    setFieldValue('tags', Array.from(now));
  };

  const toggleDOW = (values, setFieldValue, d) => {
    const now = new Set(values.schedule?.daysOfWeek || []);
    if (now.has(d)) now.delete(d); else now.add(d);
    setFieldValue('schedule.daysOfWeek', Array.from(now).sort((a,b)=>a-b));
  };

  return (
    <div className="page">
      <h2>{creating ? 'New Video Entry' : 'Edit Video Entry'}</h2>
      {section && <p style={{opacity:.8}}><b>Section:</b> {section.title}</p>}

      <Formik
        initialValues={seed}
        enableReinitialize
        validationSchema={entrySchema}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, isSubmitting, setFieldValue }) => (
          <Form className="form">
            <div>
              <label>sectionId *</label>
              <Field name="sectionId" readOnly />
              {touched.sectionId && errors.sectionId && <div className="error">{errors.sectionId}</div>}
            </div>

            <fieldset>
              <legend>Sources</legend>
              <div>
                <label>HLS URL (.m3u8) *</label>
                <Field name="hlsUrl" placeholder="https://res.cloudinary.com/.../playlist.m3u8" />
                {touched.hlsUrl && errors.hlsUrl && <div className="error">{errors.hlsUrl}</div>}
              </div>
              <div>
                <label>MP4 URL (fallback)</label>
                <Field name="mp4Url" placeholder="https://..." />
              </div>
              <div>
                <label>Poster URL *</label>
                <Field name="posterUrl" placeholder="https://..." />
                {touched.posterUrl && errors.posterUrl && <div className="error">{errors.posterUrl}</div>}
              </div>
            </fieldset>

            <fieldset>
              <legend>Playback</legend>
              <label><Field type="checkbox" name="autoplay" /> Autoplay</label>{' '}
              <label><Field type="checkbox" name="startMuted" /> Start muted</label>{' '}
              <label><Field type="checkbox" name="loop" /> Loop</label>{' '}
              <label><Field type="checkbox" name="pipAllowed" /> PiP allowed</label>
            </fieldset>

            <fieldset>
              <legend>Meta</legend>
              <div style={{display:'flex', gap:'16px'}}>
                <div>
                  <label>Aspect *</label>
                  <Field as="select" name="aspect">
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                  </Field>
                </div>
                <div>
                  <label>Duration (sec)</label>
                  <Field type="number" name="durationSec" min="0" />
                </div>
              </div>
              <div>
                <label>Caption</label>
                <Field name="caption" />
              </div>
              <div>
                <label>Credit</label>
                <Field name="credit" />
              </div>
              <div>
                <label>Tags</label>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {['promo','breaking','finance','top'].map(tag => (
                    <button type="button" key={tag}
                      onClick={()=>toggleTag(values,setFieldValue,tag)}
                      style={{padding:'2px 8px', border:'1px solid #ccc', borderRadius:6,
                              background: (values.tags || []).includes(tag) ? '#eef' : '#fff'}}>
                      {tag}
                    </button>
                  ))}
                </div>
                <small>Selected: {(values.tags||[]).join(', ') || 'none'}</small>
              </div>
            </fieldset>

            <fieldset>
              <legend>Subtitles</legend>
              <div>
                <label>Subtitle URL (.vtt)</label>
                <Field name="subtitleUrl" placeholder="https://..." />
              </div>
              <div>
                <label>Subtitle Lang</label>
                <Field name="subtitleLang" placeholder="en-IN" />
              </div>
            </fieldset>

            <fieldset>
              <legend>Availability</legend>
              <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                <div>
                  <label>Status *</label>
                  <Field as="select" name="status">
                    <option value="live">live</option>
                    <option value="draft">draft</option>
                  </Field>
                </div>
                <div>
                  <label>Published At</label>
                  <Field type="datetime-local" name="publishedAt" />
                </div>
                <div>
                  <label>Expires At</label>
                  <Field type="datetime-local" name="expiresAt" />
                </div>
              </div>

              <div>
                <label>Schedule (optional)</label>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {[1,2,3,4,5,6,7].map(d => (
                    <label key={d} style={{marginRight:8}}>
                      <input
                        type="checkbox"
                        checked={(values.schedule?.daysOfWeek || []).includes(d)}
                        onChange={()=>toggleDOW(values,setFieldValue,d)}
                      /> {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d-1]}
                    </label>
                  ))}
                </div>
                <div style={{display:'flex', gap:'16px'}}>
                  <div>
                    <label>Start (HH:mm)</label>
                    <Field name="schedule.startTime" placeholder="09:00" />
                  </div>
                  <div>
                    <label>End (HH:mm)</label>
                    <Field name="schedule.endTime" placeholder="21:00" />
                  </div>
                </div>
              </div>
            </fieldset>

            <div style={{marginTop:16}}>
              <button type="button" onClick={() => nav(`/admin/videos/sections/${values.sectionId}/entries`)}>Cancel</button>{' '}
              <button type="submit" disabled={isSubmitting}>{creating ? 'Create' : 'Update'}</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
