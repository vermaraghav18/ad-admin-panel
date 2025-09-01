// controllers/cartoonHubController.js
const CartoonHubSection = require('../models/cartoonHubSection');
const CartoonHubEntry   = require('../models/cartoonHubEntry');

// ---------- helpers ----------
const norm = (s = '') => s.toString().toLowerCase().replace(/[^a-z0-9]+/g, '');

function normalizeScope(body) {
  // accept scopeType/scopeValue or audienceType/audienceValue (or audType/audValue)
  let t = (body.scopeType || body.audienceType || body.audType || 'global').toString().trim().toLowerCase();
  let v = (body.scopeValue || body.audienceValue || body.audValue || '').toString().trim();

  if (t === 'any') t = 'global';
  if (!['global','category','state','city'].includes(t)) t = 'global';
  if (t === 'global') v = '';
  return { scopeType: t, scopeValue: v };
}

function pickPlacement(body) {
  const placement = (body.placement || body.mode || 'both').toString().toLowerCase();
  return (placement === 'swipe' || placement === 'scroll') ? placement : 'both';
}

function toSectionOut(s, withItems = true) {
  const base = {
    _id: s._id,
    name: s.name,
    heading: s.heading,
    placementIndex: s.placementIndex,
    repeatEvery: s.repeatEvery ?? 0,
    repeatCount: s.repeatCount ?? 0,
    sortIndex: s.sortIndex ?? 0,
    enabled: !!s.enabled,
    placement: s.placement || 'both',
    scopeType: s.scopeType || 'global',
    scopeValue: s.scopeValue || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
  if (!withItems) return base;
  return { ...base, items: (s.items || s.entries || []).map(toEntryOut) };
}

function toEntryOut(e) {
  return {
    _id: e._id,
    sectionId: e.sectionId || e.section,
    imageUrl: e.imageUrl,
    caption: e.caption || '',
    sortIndex: e.sortIndex ?? 0,
    enabled: !!e.enabled,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// ---------- sections ----------
exports.list = async (req, res) => {
  const secs = await CartoonHubSection
    .find({})
    .sort({ placementIndex: 1, sortIndex: 1 })
    .lean();

  // attach items
  const ids = secs.map(s => s._id);
  const items = await CartoonHubEntry.find({ sectionId: { $in: ids } }).lean();
  const itemsBy = new Map();
  for (const it of items) {
    const k = (it.sectionId || '').toString();
    if (!itemsBy.has(k)) itemsBy.set(k, []);
    itemsBy.get(k).push(it);
  }

  const out = secs.map(s => toSectionOut({ ...s, items: itemsBy.get(s._id.toString()) || [] }));
  res.json(out);
};

exports.createSection = async (req, res) => {
  try {
    const { name, heading } = req.body;
    if (!name || !heading) return res.status(400).json({ error: 'name and heading are required' });

    const { scopeType, scopeValue } = normalizeScope(req.body);

    const section = await CartoonHubSection.create({
      name: name.trim(),
      heading: heading.trim(),
      placementIndex: Math.max(1, Number(req.body.placementIndex) || 1),
      repeatEvery: Math.max(0, Number(req.body.repeatEvery) || 0),
      repeatCount: Math.max(0, Number(req.body.repeatCount) || 0),
      sortIndex: Number(req.body.sortIndex) || 0,
      enabled: req.body.enabled === false ? false : true,
      placement: pickPlacement(req.body),
      scopeType,
      scopeValue,
    });

    res.status(201).json(toSectionOut(section, false));
  } catch (e) {
    console.error('createSection error:', e);
    res.status(500).json({ error: 'create failed' });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const id = req.params.id;
    const { scopeType, scopeValue } = normalizeScope(req.body);

    const update = {
      ...(req.body.name ? { name: req.body.name.trim() } : {}),
      ...(req.body.heading ? { heading: req.body.heading.trim() } : {}),
      ...(req.body.placementIndex != null ? { placementIndex: Math.max(1, Number(req.body.placementIndex) || 1) } : {}),
      ...(req.body.repeatEvery != null ? { repeatEvery: Math.max(0, Number(req.body.repeatEvery) || 0) } : {}),
      ...(req.body.repeatCount != null ? { repeatCount: Math.max(0, Number(req.body.repeatCount) || 0) } : {}),
      ...(req.body.sortIndex != null ? { sortIndex: Number(req.body.sortIndex) || 0 } : {}),
      ...(req.body.enabled != null ? { enabled: !!req.body.enabled } : {}),
      ...(req.body.placement != null || req.body.mode != null ? { placement: pickPlacement(req.body) } : {}),
      scopeType,
      scopeValue,
    };

    const s = await CartoonHubSection.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!s) return res.status(404).json({ error: 'not found' });
    res.json(toSectionOut(s, false));
  } catch (e) {
    console.error('updateSection error:', e);
    res.status(500).json({ error: 'update failed' });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const id = req.params.id;
    await CartoonHubEntry.deleteMany({ sectionId: id });
    await CartoonHubSection.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteSection error:', e);
    res.status(500).json({ error: 'delete failed' });
  }
};

// ---------- entries ----------
exports.addEntry = async (req, res) => {
  try {
    const sectionId = req.params.id;
    const section = await CartoonHubSection.findById(sectionId);
    if (!section) return res.status(404).json({ error: 'section not found' });

    // Either file upload (req.file / req.files?.media) or direct URL
    let imageUrl = (req.body.imageUrl || '').toString().trim();
    if (!imageUrl && req.file) {
      // You might already pipe this through Cloudinary elsewhere.
      // For now assume some middleware has set req.file.url OR path:
      imageUrl = req.file.secure_url || req.file.url || req.file.path || '';
    }
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

    const entry = await CartoonHubEntry.create({
      sectionId,
      imageUrl,
      caption: (req.body.caption || '').toString(),
      sortIndex: Number(req.body.sortIndex) || 0,
      enabled: req.body.enabled === false ? false : true,
    });

    res.status(201).json(toEntryOut(entry));
  } catch (e) {
    console.error('addEntry error:', e);
    res.status(500).json({ error: 'add entry failed' });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const id = req.params.id;
    const update = {
      ...(req.body.imageUrl ? { imageUrl: req.body.imageUrl.toString().trim() } : {}),
      ...(req.body.caption != null ? { caption: (req.body.caption || '').toString() } : {}),
      ...(req.body.sortIndex != null ? { sortIndex: Number(req.body.sortIndex) || 0 } : {}),
      ...(req.body.enabled != null ? { enabled: !!req.body.enabled } : {}),
    };
    const e = await CartoonHubEntry.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!e) return res.status(404).json({ error: 'not found' });
    res.json(toEntryOut(e));
  } catch (err) {
    console.error('updateEntry error:', err);
    res.status(500).json({ error: 'update entry failed' });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const id = req.params.id;
    await CartoonHubEntry.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteEntry error:', e);
    res.status(500).json({ error: 'delete failed' });
  }
};

// ---------- feed plan ----------
// Returns a list of { sectionId, title, afterNth, repeatEvery, placement }
exports.feedPlan = async (req, res) => {
  try {
    const sectionType  = (req.query.sectionType || req.query.type || 'category').toString().toLowerCase();
    const sectionValue = (req.query.sectionValue || req.query.value || '').toString();
    const mode         = (req.query.mode || 'both').toString().toLowerCase(); // 'swipe' | 'scroll' | 'both'

    let secs = await CartoonHubSection.find({ enabled: true }).sort({ placementIndex: 1, sortIndex: 1 }).lean();

    const tNorm = norm(sectionType);
    const vNorm = norm(sectionValue);

    // Include GLOBAL everywhere. Otherwise require exact type + value match.
    secs = secs.filter((s) => {
      const sType = (s.scopeType || 'global').toLowerCase();
      const sVal  = (s.scopeValue || '').toString();
      const st = norm(sType);
      const sv = norm(sVal);

      // placement filter
      const p = (s.placement || 'both').toLowerCase();
      const placementOk = (p === 'both') || (p === mode);
      if (!placementOk) return false;

      if (st === 'global' || st === 'any') return true;

      // Top ≈ Top News normalization
      const isTop = (x) => {
        const n = norm(x);
        return n === 'top' || n === 'topnews';
      };

      if (st === 'category' && tNorm === 'category') {
        if (isTop(sectionValue) && isTop(sVal)) return true;
        return sv === vNorm;
      }

      return st === tNorm && sv === vNorm;
    });

    const out = secs.map((s) => ({
      sectionId: s._id.toString(),
      title: s.heading,
      afterNth: s.placementIndex,
      repeatEvery: s.repeatEvery ?? 0,
      placement: s.placement || 'both',
    }));

    res.json(out);
  } catch (e) {
    console.error('feedPlan error:', e);
    res.status(500).json({ error: 'feed plan failed' });
  }
};
