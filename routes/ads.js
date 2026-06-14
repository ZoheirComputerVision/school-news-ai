const express = require('express');
const router = express.Router();
const CampaignManager = require('../modules/ads/campaign-manager');
const AdInventory = require('../modules/ads/ad-inventory');
const AdTracker = require('../modules/ads/tracker');
const db = require('../database');

const campaignMgr = new CampaignManager();
const inventory = new AdInventory();
const tracker = new AdTracker();

// GET all campaigns
router.get('/campaigns', (req, res) => {
  const tenantId = req.tenant ? req.tenant.id : 1;
  const campaigns = campaignMgr.getAll(parseInt(req.query.limit) || 50, tenantId);
  res.json({ campaigns, total: campaigns.length });
});

// GET campaign by id
router.get('/campaigns/:id', (req, res) => {
  const campaign = campaignMgr.getById(parseInt(req.params.id));
  if (!campaign) return res.status(404).json({ error: 'الحملة غير موجودة' });
  res.json(campaign);
});

// GET ad zones
router.get('/zones', (req, res) => {
  res.json({ zones: inventory.getZones() });
});

// GET active ads for a zone
router.get('/zone/:zoneId', (req, res) => {
  const tenantId = req.tenant ? req.tenant.id : 1;
  const payload = inventory.getAdPayload(req.params.zoneId, tenantId);
  if (!payload) return res.json({ ad: null });
  res.json({ ad: payload });
});

// GET all advertisers
router.get('/advertisers', (req, res) => {
  const tenantId = req.tenant ? req.tenant.id : 1;
  const all = db.adapter.findAll('advertisers') || [];
  const advertisers = all.filter(a => !tenantId || !a.tenant_id || a.tenant_id === tenantId);
  res.json({ advertisers, total: advertisers.length });
});

// POST create advertiser
router.post('/advertisers', (req, res) => {
  try {
    const { company_name, contact_name, email, phone, website, notes } = req.body;
    if (!company_name) return res.status(400).json({ error: 'اسم الشركة مطلوب' });
    const tenantId = req.tenant ? req.tenant.id : 1;
    const advertiser = db.adapter.create('advertisers', {
      company_name, contact_name: contact_name || '', email: email || '',
      phone: phone || '', website: website || '', notes: notes || '',
      tenant_id: tenantId, created_at: new Date().toISOString(),
    });
    res.json({ success: true, advertiser });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST create campaign
router.post('/create', (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant.id : 1;
    const campaign = campaignMgr.create({ ...req.body, tenant_id: tenantId });
    res.json({ success: true, campaign });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PUT update campaign
router.put('/update/:id', (req, res) => {
  try {
    const campaign = campaignMgr.update(parseInt(req.params.id), req.body);
    res.json({ success: true, campaign });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST pause campaign
router.post('/pause/:id', (req, res) => {
  try {
    const campaign = campaignMgr.pause(parseInt(req.params.id));
    res.json({ success: true, campaign });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST activate campaign
router.post('/activate/:id', (req, res) => {
  try {
    const campaign = campaignMgr.activate(parseInt(req.params.id));
    res.json({ success: true, campaign });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE campaign
router.delete('/delete/:id', (req, res) => {
  try {
    campaignMgr.delete(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET stats
router.get('/stats', (req, res) => {
  const tenantId = req.tenant ? req.tenant.id : 1;
  const stats = campaignMgr.getStats(tenantId);
  const daily = tracker.getDailyReport();
  const weekly = tracker.getWeeklyReport();
  const monthly = tracker.getMonthlyReport();
  res.json({ ...stats, daily, weekly, monthly });
});

// POST track impression
router.post('/track/impression/:id', (req, res) => {
  const ok = tracker.trackImpression(parseInt(req.params.id));
  res.json({ success: ok });
});

// POST track click
router.post('/track/click/:id', (req, res) => {
  const ok = tracker.trackClick(parseInt(req.params.id));
  res.json({ success: ok });
});

// GET daily report
router.get('/reports/daily', (req, res) => {
  res.json(tracker.getDailyReport(req.query.date || null));
});

// GET weekly report
router.get('/reports/weekly', (req, res) => {
  res.json(tracker.getWeeklyReport());
});

// GET monthly report
router.get('/reports/monthly', (req, res) => {
  res.json(tracker.getMonthlyReport());
});

module.exports = router;
