const express = require('express');
const router = express.Router();
const db = require('../database');
const { ArchiveRepository } = require('../lib/repositories/archive-repository');

const articles = db.articles;
const archiveRepo = new ArchiveRepository(db.adapter);

router.get('/status', (req, res) => {
  res.json({ platform: 'الصوت المحلي', tagline: 'إهتمام محلي ... إلتزام وطني', location: 'ولاية تيارت — الجزائر', description: 'منصة جهوية للإعلام العام والتنمية المحلية', version: '1.0', status: 'active', last_update: new Date().toISOString() });
});

router.get('/content', (req, res) => {
  const { category, status, limit = 20, offset = 0, sort } = req.query;
  const result = articles.findPublished({ category, limit: parseInt(limit), offset: parseInt(offset), sort });

  const viewCounts = {};
  db.adapter.findAll('views').forEach(v => { viewCounts[v.content_id] = (viewCounts[v.content_id] || 0) + 1; });
  const items = result.items.map(item => ({ ...item, view_count: viewCounts[item.id] || 0 }));

  res.json({ items, total: result.total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get('/content/:id', (req, res) => {
  const item = articles.findById(parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'غير موجود' });
  const media = db.adapter.where('media', { content_id: item.id });
  const viewCount = articles.getViewCount(item.id);
  res.json({ ...item, media, view_count: viewCount });
});

router.post('/content/:id/view', (req, res) => {
  const id = parseInt(req.params.id);
  const content = articles.findById(id);
  if (!content) return res.status(404).json({ error: 'غير موجود' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress;
  const total = articles.addView(id, ip);
  res.json({ content_id: id, view_count: total });
});

router.get('/timeline', (req, res) => res.json(archiveRepo.buildTimeline()));
router.get('/stats', (req, res) => res.json(archiveRepo.getStats()));

router.get('/categories', (req, res) => res.json(articles.getCategories()));

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ items: [] });
  const items = articles.search(q);
  res.json({ items, total: items.length, query: q });
});

router.get('/recent', (req, res) => {
  const items = articles.find(c => c.status === 'published')
    .sort((a, b) => (b.published_at || '').localeCompare((a.published_at || '')))
    .slice(0, 10);
  res.json(items);
});

module.exports = router;
