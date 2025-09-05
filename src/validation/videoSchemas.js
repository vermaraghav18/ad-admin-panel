// admin/src/validation/videoSchemas.js
import * as Yup from 'yup';

const hhmm = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const sectionSchema = Yup.object({
  title: Yup.string().trim().required('Title is required'),
  sectionKey: Yup.string().trim().nullable(),
  scopeType: Yup.mixed().oneOf(['global', 'category', 'state', 'city']).required(),
  scopeValue: Yup.string().when('scopeType', (scopeType, s) =>
    scopeType && scopeType !== 'global'
      ? s.string().trim().required('Scope value is required')
      : s.string().trim().nullable()
  ),
  placement: Yup.mixed().oneOf(['scroll', 'swipe', 'both']).required(),
  injection: Yup.object({
    afterNth: Yup.number().integer().min(1, 'Min 1').required('Required'),
    repeatEvery: Yup.number().integer().min(0, 'Min 0').required('Required'),
    repeatCount: Yup.number().integer().min(0, 'Min 0').required('Required'),
  }),
  sortIndex: Yup.number().integer().required(),
  enabled: Yup.boolean().required(),
});

export const entrySchema = Yup.object({
  sectionId: Yup.string().required('sectionId is required'),
  hlsUrl: Yup.string().url('Must be a valid URL (https://)').required('HLS URL required'),
  mp4Url: Yup.string().url('Must be a valid URL (https://)').nullable(),
  posterUrl: Yup.string().url('Must be a valid URL (https://)').required('Poster URL required'),

  autoplay: Yup.boolean().required(),
  startMuted: Yup.boolean().required(),
  loop: Yup.boolean().required(),
  pipAllowed: Yup.boolean().required(),

  durationSec: Yup.number().integer().min(0).nullable(),
  aspect: Yup.mixed().oneOf(['16:9', '9:16', '1:1']).required(),
  caption: Yup.string().nullable(),
  credit: Yup.string().nullable(),
  tags: Yup.array().of(Yup.string().trim()),

  subtitleUrl: Yup.string().url('Must be a valid URL (https://)').nullable(),
  subtitleLang: Yup.string().trim().nullable(),

  status: Yup.mixed().oneOf(['draft', 'live']).required(),
  publishedAt: Yup.date().nullable(),
  expiresAt: Yup.date().nullable(),

  schedule: Yup.object({
    daysOfWeek: Yup.array().of(Yup.number().integer().min(1).max(7)),
    startTime: Yup.string().matches(hhmm, 'Use HH:mm (24h)').nullable(),
    endTime: Yup.string().matches(hhmm, 'Use HH:mm (24h)').nullable(),
  }),
});
