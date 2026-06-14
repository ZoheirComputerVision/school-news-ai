const cron = require('node-cron');
const db = require('../database');
const { SettingsRepository } = require('../lib/repositories/settings-repository');
const { ArticleRepository } = require('../lib/repositories/article-repository');
const { ArchiveRepository } = require('../lib/repositories/archive-repository');

const settingsRepo = new SettingsRepository(db.adapter);
const articles = new ArticleRepository(db.adapter);
const archiveRepo = new ArchiveRepository(db.adapter);

class Scheduler {
  constructor() { this.jobs = []; this.running = false; }

  start() {
    if (this.running) return;
    this.running = true;
    this.jobs.push(cron.schedule('*/30 * * * *', () => this.runCollector()));
    this.jobs.push(cron.schedule('*/15 * * * *', () => this.runAnalyzer()));
    this.jobs.push(cron.schedule('*/10 * * * *', () => this.runPublisher()));
    this.jobs.push(cron.schedule('0 */6 * * *', () => this.runArchiveSync()));
    this.jobs.push(cron.schedule('0 0 * * *', () => this.resetDailyCount()));
    console.log(`[Scheduler] ${this.jobs.length} مهمة مجدولة بدأت`);
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.running = false;
    console.log('[Scheduler] جميع المهام المجدولة أوقفت');
  }

  async runCollector() {
    console.log('[Scheduler] تشغيل مهمة الجمع...');
    try {
      const collector = require('./collector');
      const results = await collector.collectAll();
      settingsRepo.set('last_scheduler_run', new Date().toISOString());
      console.log(`[Scheduler] ✓ جمع ${results.length} عنصر`);
    } catch (e) { console.error('[Scheduler] ✗ فشل الجمع:', e.message); }
  }

  async runAnalyzer() {
    console.log('[Scheduler] تشغيل مهمة التحليل (المصنف 9 فئات)...');
    try {
      const pending = db.rawData.find(r => r.status === 'pending');
      const analyzer = require('./analyzer');
      const EditorialClassifier = require('./classifier');
      const classifier = new EditorialClassifier();
      for (const item of pending.slice(0, 5)) {
        try {
          const result = await analyzer.analyzeRawData(item.id);
          if (result) {
            const label = classifier.getCategoryLabel(result.classification.category);
            console.log(`  ✓ تحليل #${item.id}: ${label} (ثقة ${Math.round(result.classification.confidence * 100)}%)`);
          }
        } catch (e) { console.error(`  ✗ فشل تحليل #${item.id}:`, e.message); }
      }
      console.log(`[Scheduler] ✓ تم تحليل ${Math.min(pending.length, 5)} عنصر`);
    } catch (e) { console.error('[Scheduler] ✗ فشل التحليل:', e.message); }
  }

  async runPublisher() {
    console.log('[Scheduler] تشغيل مهمة النشر...');
    try {
      const publisher = require('./publisher');
      const queue = publisher.getQueue();
      const candidates = queue.filter(c => c.status === 'draft' || c.overall_score >= 0.7);
      for (const item of candidates.slice(0, 3)) {
        try {
          const writer = require('./writer');
          if (!item.writer_version) await writer.generateForContent(item.id);
          const result = await publisher.publish(item.id);
          console.log(`  ${result.success ? '✓' : '○'} نشر #${item.id}: ${result.message}`);
        } catch (e) { console.error(`  ✗ فشل نشر #${item.id}:`, e.message); }
      }
      console.log(`[Scheduler] ✓ معالجة ${Math.min(candidates.length, 3)} عنصر من قائمة الانتظار`);
    } catch (e) { console.error('[Scheduler] ✗ فشل النشر:', e.message); }
  }

  async runArchiveSync() {
    console.log('[Scheduler] تشغيل مزامنة الأرشيف...');
    try {
      const unarchived = articles.find(pc => {
        const inArchive = archiveRepo.findByContentId(pc.id);
        return (pc.status === 'published' || pc.status === 'rejected') && !inArchive;
      });
      const publisher = require('./publisher');
      for (const item of unarchived) {
        publisher.archive(item.id, 'scheduler_sync');
      }
      console.log(`[Scheduler] ✓ أرشفة ${unarchived.length} عنصر`);
    } catch (e) { console.error('[Scheduler] ✗ فشل الأرشفة:', e.message); }
  }

  resetDailyCount() {
    settingsRepo.set('total_published_today', '0');
    settingsRepo.set('publish_date', new Date().toISOString().split('T')[0]);
    console.log('[Scheduler] ✓ إعادة تعيين العداد اليومي');
  }
}

module.exports = new Scheduler();
