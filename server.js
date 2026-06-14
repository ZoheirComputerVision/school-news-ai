const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const scheduler = require('./modules/scheduler');
const { apiLimiter, csrfProtection } = require('./middleware/validate');
const editorialRoutes = require('./routes/editorial');
const adRoutes = require('./routes/ads');
const tenantRoutes = require('./routes/tenants');
const tenantAdminRoutes = require('./routes/tenant-admin');
const { tenantMiddleware } = require('./middleware/tenant');
const { ensureEditorialTables } = require('./modules/editorial/migrate');
const { ensureAdTables } = require('./modules/ads/migrate');
const { ensureTenantTables, migrateExistingData } = require('./modules/tenant/migrate');

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiLimiter);

// Tenant middleware (resolves tenant from URL slug or header)
app.use(tenantMiddleware);

app.use(express.static(config.PUBLIC_DIR));
app.use('/admin', express.static(config.ADMIN_DIR));

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/editorial', editorialRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenant', tenantAdminRoutes);

app.get('/', (req, res) => res.sendFile(path.join(config.PUBLIC_DIR, 'index.html')));

app.get('/admin', (req, res) => res.sendFile(path.join(config.ADMIN_DIR, 'index.html')));
app.get('/admin/*', (req, res) => {
  const page = req.params[0] || 'index.html';
  const filePath = path.join(config.ADMIN_DIR, page);
  res.sendFile(filePath, err => { if (err) res.sendFile(path.join(config.ADMIN_DIR, 'index.html')); });
});

app.get('/section/:category', (req, res) => res.sendFile(path.join(config.PUBLIC_DIR, 'section.html')));
app.get('/archive', (req, res) => res.sendFile(path.join(config.PUBLIC_DIR, 'archive.html')));
app.get('/search', (req, res) => res.sendFile(path.join(config.PUBLIC_DIR, 'search.html')));

app.get('/article/:id', (req, res) => res.sendFile(path.join(config.PUBLIC_DIR, 'article.html')));

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const seed = require('./modules/seed');

app.listen(config.PORT, async () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  🎙️  الصوت المحلي`);
  console.log(`  ${config.SCHOOL_NAME}`);
  console.log(`  ${config.SCHOOL_SUB}`);
  console.log(`  ───────────────────────────────────────`);
  console.log(`  جريدة مدرسية إلكترونية بتقنيات AI`);
  console.log(`  إدارة تقنية: ${config.ADMIN_TEAM}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ➜  http://localhost:${config.PORT}`);
  console.log(`  ➜  الإدارة: http://localhost:${config.PORT}/admin`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await seed.seedIfEmpty();
  await ensureEditorialTables();
  await ensureAdTables();
  await ensureTenantTables();
  await migrateExistingData();
  scheduler.start();
});

module.exports = app;
