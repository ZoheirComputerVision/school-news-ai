const express = require('express');
const router = express.Router();
const TenantRegistry = require('../modules/tenant/tenant-registry');
const TenantConfigManager = require('../modules/tenant/config-manager');

const registry = new TenantRegistry();
const configMgr = new TenantConfigManager();

router.get('/', (req, res) => {
  const tenants = registry.getAll();
  res.json({ tenants, total: tenants.length });
});

router.get('/active', (req, res) => {
  const tenants = registry.getActive();
  res.json({ tenants, total: tenants.length });
});

router.get('/stats', (req, res) => {
  res.json(registry.getStats());
});

router.get('/:id', (req, res) => {
  const tenant = registry.getById(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'المنصة غير موجودة' });
  res.json(tenant);
});

router.post('/create', (req, res) => {
  try {
    const tenant = registry.create(req.body);
    res.json({ success: true, tenant });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/update/:id', (req, res) => {
  try {
    const tenant = registry.update(req.params.id, req.body);
    res.json({ success: true, tenant });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/activate/:id', (req, res) => {
  try {
    const tenant = registry.activate(req.params.id);
    res.json({ success: true, tenant });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/deactivate/:id', (req, res) => {
  try {
    const tenant = registry.deactivate(req.params.id);
    res.json({ success: true, tenant });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Tenant config endpoints
router.get('/:id/config', (req, res) => {
  try {
    const config = configMgr.getAll(req.params.id);
    res.json({ config });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id/config', (req, res) => {
  try {
    configMgr.setBulk(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
