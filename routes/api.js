const express = require('express');
const router = express.Router();
const db = require('../database');
const { ArchiveRepository } = require('../lib/repositories/archive-repository');
const { navItems, regionalSubmenu, categoryToSlug, slugToCategory, getNavItemById, getCategoryForSlug } = require('../config/navigation');

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

router.get('/nav', (req, res) => {
  res.json({ items: navItems, regionalSubmenu });
});

router.get('/latest-news', (req, res) => {
  const result = articles.findPublished({ sort: 'published_at', limit: 10 });
  const items = result.items.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    category: item.category,
    published_at: item.published_at,
    image_url: item.image_url || '',
  }));
  res.json({ items, total: result.total });
});

router.get('/section/:category', (req, res) => {
  const { category } = req.params;
  const navItem = navItems.find(n => n.path === `/section/${category}`);
  const classifierCategory = getCategoryForSlug(category);

  const response = {
    featured: null,
    latest: [],
    mostViewed: [],
    total: 0,
    category,
    meta: navItem ? navItem.meta : { title: category, description: '' },
  };

  if (classifierCategory) {
    const featuredResult = articles.findPublished({ category: classifierCategory, sort: 'overall_score', limit: 1 });
    response.featured = featuredResult.items[0] || null;

    const latestResult = articles.findPublished({ category: classifierCategory, sort: 'published_at', limit: 10 });
    response.latest = latestResult.items;
    response.total = latestResult.total;

    const allInCategory = articles.find(c => c.status === 'published' && c.category === classifierCategory);
    const viewCounts = {};
    db.adapter.findAll('views').forEach(v => {
      viewCounts[v.content_id] = (viewCounts[v.content_id] || 0) + 1;
    });
    response.mostViewed = allInCategory
      .map(item => ({ ...item, view_count: viewCounts[item.id] || 0 }))
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 5);
  }

  res.json(response);
});

router.get('/archive-data', (req, res) => {
  const published = articles.find(c => c.status === 'published');
  const byYear = {};
  const byCategory = {};

  for (const item of published) {
    const dateStr = item.event_date || (item.published_at || '').split('T')[0] || '';
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1] || '00';

    if (!year) continue;

    if (!byYear[year]) byYear[year] = { months: {}, total: 0 };
    if (!byYear[year].months[month]) byYear[year].months[month] = 0;
    byYear[year].months[month]++;
    byYear[year].total++;

    const catSlug = categoryToSlug[item.category] || item.category || 'uncategorized';
    byCategory[catSlug] = (byCategory[catSlug] || 0) + 1;
  }

  const years = Object.keys(byYear).sort((a, b) => b - a);

  res.json({ years, byYear, byCategory, total: published.length });
});

router.get('/search', (req, res) => {
  const { q, type } = req.query;
  if (!q || q.length < 2) return res.json({ items: [], total: 0, query: q || '' });

  const query = q.toLowerCase();
  let items = [];

  const matchTag = (item) => {
    if (!item.tags) return false;
    if (typeof item.tags === 'string') return item.tags.toLowerCase().includes(query);
    if (Array.isArray(item.tags)) return item.tags.some(t => t.toLowerCase().includes(query));
    return false;
  };

  const matchText = (item) =>
    (item.title || '').toLowerCase().includes(query) ||
    (item.body || '').toLowerCase().includes(query);

  if (!type || type === 'articles') {
    items = articles.find(c =>
      c.status === 'published' && (matchText(c) || matchTag(c))
    ).slice(0, 20);
  }

  if (type === 'tags') {
    items = articles.find(c =>
      c.status === 'published' && matchTag(c)
    ).slice(0, 20);
  }

  if (type === 'categories') {
    items = articles.find(c =>
      c.status === 'published' && (c.category || '').toLowerCase().includes(query)
    ).slice(0, 20);
  }

  if (type === 'archive') {
    const archived = db.adapter.findAll('archive') || [];
    items = archived
      .filter(a => {
        const data = a.original_data ? (typeof a.original_data === 'string' ? JSON.parse(a.original_data) : a.original_data) : {};
        return (data.title || '').toLowerCase().includes(query) || (data.body || '').toLowerCase().includes(query);
      })
      .slice(0, 20);
  }

  res.json({ items, total: items.length, query: q });
});

router.get('/homepage', (req, res) => {
  const HomepageSelector = require('../modules/editorial/homepage-selector');
  const selector = new HomepageSelector();
  const data = selector.buildHomepage();
  res.json(data);
});

router.get('/recent', (req, res) => {
  const items = articles.find(c => c.status === 'published')
    .sort((a, b) => (b.published_at || '').localeCompare((a.published_at || '')))
    .slice(0, 10);
  res.json(items);
});

module.exports = router;
