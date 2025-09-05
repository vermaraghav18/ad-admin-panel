// admin/src/pages/videos/VideoSectionForm.jsx
import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { sectionSchema } from '../../validation/videoSchemas';
import { getSection, createSection, updateSection } from '../../services/videosApi';
import { useNavigate, useParams } from 'react-router-dom';

const initial = {
  title: '',
  sectionKey: '',
  scopeType: 'global',
  scopeValue: '',
  placement: 'both',
  injection: { afterNth: 5, repeatEvery: 0, repeatCount: 0 },
  sortIndex: 0,
  enabled: true,
};

export default function VideoSectionForm() {
  const { id } = useParams(); // if present => edit
  const nav = useNavigate();
  const [seed, setSeed] = useState(initial);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      const data = await getSection(id);
      if (data && data.section) {
        // normalize for form
        setSeed({
          title: data.section.title || '',
          sectionKey: data.section.sectionKey || '',
          scopeType: data.section.scopeType || 'global',
          scopeValue: data.section.scopeValue || '',
          placement: data.section.placement || 'both',
          injection: {
            afterNth: data.section.injection?.afterNth ?? 5,
            repeatEvery: data.section.injection?.repeatEvery ?? 0,
            repeatCount: data.section.injection?.repeatCount ?? 0,
          },
          sortIndex: data.section.sortIndex ?? 0,
          enabled: data.section.enabled ?? true,
        });
      }
      setLoading(false);
    };
    run();
  }, [id]);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      if (id) await updateSection(id, values);
      else await createSection(values);
      nav('/admin/videos/sections');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="page">
      <h2>{id ? 'Edit Video Section' : 'New Video Section'}</h2>

      <Formik
        initialValues={seed}
        enableReinitialize
        validationSchema={sectionSchema}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, isSubmitting, setFieldValue }) => (
          <Form className="form">
            <div>
              <label>Title *</label>
              <Field name="title" />
              {touched.title && errors.title && <div className="error">{errors.title}</div>}
            </div>

            <div>
              <label>Section Key</label>
              <Field name="sectionKey" />
            </div>

            <div style={{display:'flex', gap:'16px'}}>
              <div>
                <label>Scope Type *</label>
                <Field as="select" name="scopeType"
                  onChange={(e)=>{ setFieldValue('scopeType', e.target.value); if(e.target.value==='global') setFieldValue('scopeValue',''); }}>
                  <option value="global">global</option>
                  <option value="category">category</option>
                  <option value="state">state</option>
                  <option value="city">city</option>
                </Field>
              </div>
              <div style={{flex:1}}>
                <label>Scope Value {values.scopeType !== 'global' ? '*' : ''}</label>
                <Field name="scopeValue" placeholder={values.scopeType === 'category' ? 'e.g., top, finance' : ''}/>
                {touched.scopeValue && errors.scopeValue && <div className="error">{errors.scopeValue}</div>}
              </div>
            </div>

            <div>
              <label>Placement *</label>
              <Field as="select" name="placement">
                <option value="both">both</option>
                <option value="scroll">scroll</option>
                <option value="swipe">swipe</option>
              </Field>
            </div>

            <fieldset>
              <legend>Injection</legend>
              <div style={{display:'flex', gap:'16px'}}>
                <div>
                  <label>afterNth *</label>
                  <Field type="number" name="injection.afterNth" min="1" />
                  {touched.injection?.afterNth && errors.injection?.afterNth && <div className="error">{errors.injection.afterNth}</div>}
                </div>
                <div>
                  <label>repeatEvery *</label>
                  <Field type="number" name="injection.repeatEvery" min="0" />
                </div>
                <div>
                  <label>repeatCount *</label>
                  <Field type="number" name="injection.repeatCount" min="0" />
                </div>
              </div>
              <small>
                Preview:{' '}
                {(() => {
                  const a = Number(values.injection.afterNth || 0);
                  const n = Number(values.injection.repeatEvery || 0);
                  const c = Number(values.injection.repeatCount || 0);
                  const slots = [a, ...Array.from({ length: c }, (_, i) => a + n * (i + 1))].filter(x => x > 0);
                  return slots.join(', ').replace(/^/, '#');
                })()}
              </small>
            </fieldset>

            <div style={{display:'flex', gap:'16px'}}>
              <div>
                <label>Sort Index *</label>
                <Field type="number" name="sortIndex" />
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <Field type="checkbox" name="enabled" id="enabled" />
                <label htmlFor="enabled">Enabled</label>
              </div>
            </div>

            <div style={{marginTop:16}}>
              <button type="button" onClick={() => nav('/admin/videos/sections')}>Cancel</button>{' '}
              <button type="submit" disabled={isSubmitting}>{id ? 'Update' : 'Create'}</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
