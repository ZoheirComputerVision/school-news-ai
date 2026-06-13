const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database');
const config = require('../config');
const collector = require('../modules/collector');
const analyzer = require('../modules/analyzer');
const writer = require('../modules/writer');
const publisher = require('../modules/publisher');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, csrfProtection, validateManualInput } = require('../middleware/validate');

const articles = db.articles;
const settingsRepo = db.settings;
const archiveRepo = db.archive;

router.post('/auth', authLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' });
  }
  if (username !== config.ADMIN_USERNAME) {
    return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
  }
  const passwordMatch = bcrypt.compareSync(password, config.ADMIN_PASSWORD);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
  }
  const token = jwt.sign(
    { username: config.ADMIN_USERNAME, role: 'admin' },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ success: true, token, user: 'Zoheir IT Solutions' });
});

router.use(authenticateToken);
router.use(csrfProtection);

router.get('/dashboard', (req, res) => res.json(archiveRepo.getStats()));

router.get('/content', (req, res) => {
  const { status, category, limit = 50, offset = 0 } = req.query;
  let items = articles.findAll();
  if (status) items = items.filter(i => i.status === status);
  if (category) items = items.filter(i => i.category === category);
  items.sort((a, b) => (b.created_at || '').localeCompare((a.created_at || '')));
  const total = items.length;
  items = items.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json({ items, total });
});

router.get('/content/:id', (req, res) => {
  const item = articles.findById(parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'غير موجود' });
  const logs = articles.getDecisionLogs(item.id);
  res.json({ ...item, logs });
});

router.post('/content/:id/approve', async (req, res) => {
  try {
    const result = await publisher.approveManual(parseInt(req.params.id));
    res.json(result);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/content/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await publisher.reject(parseInt(req.params.id), reason || 'مرفوض من المشرف');
    res.json(result);
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/content/:id/delete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const content = articles.findById(id);
    if (!content) return res.status(404).json({ success: false, error: 'غير موجود' });
    articles.delete(id);
    db.adapter.saveNow('processed_content');
    const archived = archiveRepo.findByContentId(id);
    if (archived) archiveRepo.delete(archived.id);
    db.adapter.saveNow('archive');
    res.json({ success: true, message: 'تم الحذف نهائيًا' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/content/:id/update', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, body, category, source_name, event_date } = req.body;
    const content = articles.findById(id);
    if (!content) return res.status(404).json({ success: false, error: 'غير موجود' });
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (category !== undefined) updateData.category = category;
    if (source_name !== undefined) updateData.source_name = source_name;
    if (event_date !== undefined) updateData.event_date = event_date;
    const updated = articles.update(id, updateData);
    db.adapter.saveNow('processed_content');
    res.json({ success: true, content: updated, message: 'تم التعديل بنجاح' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/content/:id/generate', async (req, res) => {
  try {
    const article = await writer.generateForContent(parseInt(req.params.id));
    res.json({ success: true, article });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/collect', async (req, res) => {
  try {
    const items = await collector.collectAll();
    res.json({ success: true, collected: items.length, items });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/collect/manual', validateManualInput, async (req, res) => {
  try {
    const { title, body, category, source, event_date, image_data } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, error: 'العنوان والمحتوى مطلوبان' });
    const data = { title, body, source: source || 'إداري', category: category || 'uncategorized', event_date: event_date || new Date().toISOString().split('T')[0], source_url: '' };
    if (image_data && typeof image_data === 'string' && image_data.startsWith('data:')) {
      const matches = image_data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].split('/')[1] || 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filepath = path.join(__dirname, '..', 'public', 'uploads', filename);
        fs.writeFileSync(filepath, buffer);
        data.image_data = `/uploads/${filename}`;
      } else {
        data.image_data = image_data;
      }
    } else if (image_data) {
      data.image_data = image_data;
    }
    const result = await collector.collectManual(data);
    const rawRows = db.adapter.findOne('raw_data', r => r.content_hash === result.hash);
    if (rawRows) await analyzer.analyzeRawData(rawRows.id);
    res.json({ success: true, message: 'تم إرسال المحتوى للمعالجة' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const pending = db.rawData.find(r => r.status === 'pending').slice(0, 5);
    const results = [];
    for (const item of pending) {
      const result = await analyzer.analyzeRawData(item.id);
      if (result) results.push({ id: item.id, ...result });
    }
    res.json({ success: true, processed: results.length, results });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/publish', async (req, res) => {
  try {
    const candidates = articles.find(c => c.status !== 'published' && c.status !== 'rejected').slice(0, 10);
    const results = [];
    for (const item of candidates) {
      if (!item.writer_version) {
        await writer.generateForContent(item.id);
      }
      const result = await publisher.publish(item.id);
      results.push({ id: item.id, ...result, current_status: item.status });
    }
    res.json({ success: true, processed: results.length, results });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/logs', (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const result = articles.getAllLogs({ limit: parseInt(limit), offset: parseInt(offset) });
  res.json(result);
});

router.get('/settings', (req, res) => res.json(settingsRepo.getAll()));

router.post('/settings', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'Key required' });
  settingsRepo.set(key, value);
  res.json({ success: true, key, value });
});

router.post('/archive/export', (req, res) => {
  const filePath = archiveRepo.exportToJSON();
  res.json({ success: true, path: filePath });
});

router.get('/archive/timeline', (req, res) => res.json(archiveRepo.buildTimeline()));

router.get('/sources', (req, res) => res.json(db.sources.findAll()));

router.post('/scheduler/run-collector', async (req, res) => {
  try {
    const s = require('../modules/scheduler');
    await s.runCollector();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
