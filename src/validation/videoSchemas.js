// admin/src/validation/videoSchemas.js
import { object, string, number, boolean, array, mixed, date } from 'yup';

const hhmm = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const sectionSchema = object({
  title: string().trim().required('Title is required'),
  sectionKey: string().trim().nullable(),
  scopeType: mixed().oneOf(['global', 'category', 'state', 'city']).required(),
  scopeValue: string()
    .trim()
    .when('scopeType', {
      is: (v) => v && v !== 'global',
      then: (sch) => sch.required('Scope value is required'),
      otherwise: (sch) => sch.nullable(),
    }),
  placement: mixed().oneOf(['scroll', 'swipe', 'both']).required(),
  injection: object({
    afterNth: number().integer().min(1, 'Min 1').required('Required'),
    repeatEvery: number().integer().min(0, 'Min 0').required('Required'),
    repeatCount: number().integer().min(0, 'Min 0').required('Required'),
  }),
  sortIndex: number().integer().required(),
  enabled: boolean().required(),
});

export const entrySchema = object({
  sectionId: string().required('sectionId is required'),
  hlsUrl: string().url('Must be a valid URL (https://)').required('HLS URL required'),
  mp4Url: string().url('Must be a valid URL (https://)').nullable(),
  posterUrl: string().url('Must be a valid URL (https://)').required('Poster URL required'),

  autoplay: boolean().required(),
  startMuted: boolean().required(),
  loop: boolean().required(),
  pipAllowed: boolean().required(),

  durationSec: number().integer().min(0).nullable(),
  aspect: mixed().oneOf(['16:9', '9:16', '1:1']).required(),
  caption: string().nullable(),
  credit: string().nullable(),
  tags: array(string().trim()),

  subtitleUrl: string().url('Must be a valid URL (https://)').nullable(),
  subtitleLang: string().trim().nullable(),

  status: mixed().oneOf(['draft', 'live']).required(),
  publishedAt: date().nullable(),
  expiresAt: date().nullable(),

  schedule: object({
    daysOfWeek: array(number().integer().min(1).max(7)),
    startTime: string().matches(hhmm, 'Use HH:mm (24h)').nullable(),
    endTime: string().matches(hhmm, 'Use HH:mm (24h)').nullable(),
  }).nullable(),
});
