const db = require('../database');
const collector = require('./collector');
const { ArticleRepository } = require('../lib/repositories/article-repository');
const { ArchiveRepository } = require('../lib/repositories/archive-repository');

const articles = new ArticleRepository(db.adapter);
const archiveRepo = new ArchiveRepository(db.adapter);

async function seedIfEmpty() {
  const count = articles.count();
  if (count > 0) {
    console.log(`[Seed] البيانات موجودة مسبقًا (${count} محتوى) - تخطي التهيئة`);
    return;
  }

  console.log('[Seed] بدء التهيئة الأولية للبيانات...');

  const items = await collector.collectAll();
  console.log(`[Seed] تم جمع ${items.length} عنصر`);

  const analyzer = require('./analyzer');
  for (const item of items) {
    const raw = db.rawData.findOne(r => r.content_hash === item.hash);
    if (raw) {
      await analyzer.analyzeRawData(raw.id);
    }
  }
  console.log('[Seed] تم تحليل جميع العناصر');

  const publisher = require('./publisher');
  const writer = require('./writer');
  const drafts = articles.findDraftsForPublish();
  for (const draft of drafts) {
    await writer.generateForContent(draft.id);
    await publisher.publish(draft.id);
  }
  console.log(`[Seed] تم نشر ${drafts.length} عنصر تلقائيًا`);

  ['processed_content', 'raw_data', 'ai_decision_log', 'archive', 'admin_actions'].forEach(t => { try { db.adapter.saveNow(t); } catch {} });
  const stats = archiveRepo.getStats();
  console.log(`[Seed] ✓ اكتملت التهيئة: ${stats.total_published} منشور، ${stats.total_review} للمراجعة، ${stats.total_ai_decisions} قرار AI`);
}

module.exports = { seedIfEmpty };
