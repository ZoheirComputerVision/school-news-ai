const { ScraperFactory } = require('../lib/scraper');
const { ContentNormalizer } = require('./normalizer');
const { DedupEngine } = require('./dedup');
const { SourceScorer } = require('./scorer');
const { CollectorMonitor } = require('./monitor');
const SourceRegistry = require('./source-registry');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const rawDataRepo = db.rawData;

class DataCollector {
  constructor() {
    this.dedup = new DedupEngine(db.adapter);
    this.scorer = new SourceScorer(db.adapter);
    this.monitor = new CollectorMonitor(db.adapter);
  }

  async collectAll() {
    console.log('[Collector] بدء جمع البيانات عبر Source Registry...');
    const sources = SourceRegistry.getActive();
    const results = [];
    let totalDeduped = 0;
    let totalFailed = 0;
    const startTime = Date.now();

    for (const source of sources) {
      if (!SourceRegistry.shouldSync(source)) {
        console.log(`[Collector] ${source.name}: تجاوز (لم يحن وقت المزامنة)`);
        continue;
      }
      try {
        const items = await this._collectFromSource(source);
        results.push(...items.collected);
        totalDeduped += items.deduped;
        totalFailed += items.failed;
        const ok = items.failed === 0 && (items.collected.length > 0 || items.deduped > 0);
        SourceRegistry.markSync(source.id, ok);
        this.scorer.updateSourceScore(source);
        this.monitor.logRun({
          status: ok ? 'success' : 'partial',
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          itemsCollected: items.collected.length,
          itemsDeduped: items.deduped,
          itemsFailed: items.failed,
          duration: Date.now() - startTime,
        });
      } catch (e) {
        console.error(`[Collector] ${source.name} error:`, e.message);
        totalFailed++;
        SourceRegistry.markError(source.id, e.message);
        this.monitor.logRun({
          status: 'failed',
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          error: e.message,
          duration: Date.now() - startTime,
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Collector] تم جمع ${results.length} عنصر (مكرر: ${totalDeduped}, فاشل: ${totalFailed}) في ${totalDuration}ms`);
    return results;
  }

  async _collectFromSource(source) {
    const scraper = ScraperFactory.create(source);
    if (!scraper) return { collected: [], deduped: 0, failed: 0 };

    let rawItems = [];
    try {
      if (scraper.type === 'rss') {
        const result = await scraper.collector.fetchFeed(source.url);
        rawItems = result.ok ? result.items : [];
      } else if (scraper.type === 'web') {
        const result = await scraper.collector.scrape(source.url);
        rawItems = result.ok ? [result] : [];
      } else {
        rawItems = await scraper.fetchPosts(20);
      }
    } catch {
      return { collected: [], deduped: 0, failed: 1 };
    }

    const collected = [];
    let deduped = 0;
    let failed = 0;

    for (const raw of rawItems) {
      try {
        const normalized = ContentNormalizer.normalize(raw, source);
        if (!normalized) { failed++; continue; }

        const rawText = JSON.stringify(normalized);
        const hash = this.dedup.computeHash(rawText);

        const dupResult = await this.dedup.isDuplicate({
          raw_text: rawText,
          body: normalized.body,
          title: normalized.title,
          source_url: normalized.sourceUrl,
        });

        if (dupResult.isDuplicate) { deduped++; continue; }

        const record = rawDataRepo.create({
          source_id: source.id,
          raw_text: rawText,
          content_hash: hash,
          status: 'pending',
        });

        collected.push({ ...normalized, hash, raw_id: record.id });
      } catch {
        failed++;
      }
    }

    return { collected, deduped, failed };
  }

  async collectFacebook() {
    const sources = SourceRegistry.getByType('facebook');
    const results = [];
    for (const s of sources) {
      if (!SourceRegistry.shouldSync(s)) continue;
      const r = await this._collectFromSource(s);
      SourceRegistry.markSync(s.id, r.failed === 0);
      results.push(...r.collected);
    }
    return results;
  }

  async collectMinistry() {
    const sources = SourceRegistry.getByCategory('official');
    const results = [];
    for (const s of sources) {
      if (!SourceRegistry.shouldSync(s)) continue;
      const r = await this._collectFromSource(s);
      SourceRegistry.markSync(s.id, r.failed === 0);
      results.push(...r.collected);
    }
    return results;
  }

  async collectManual(data) {
    const source = SourceRegistry.getByType('manual')[0];
    const normalized = ContentNormalizer.normalize(data, source);
    const rawText = JSON.stringify(normalized || data);
    const hash = uuidv4().replace(/-/g, '').slice(0, 16);
    const record = rawDataRepo.create({
      source_id: source?.id || 1,
      raw_text: rawText,
      content_hash: hash,
      status: 'pending',
    });
    return { ...(normalized || data), hash, raw_id: record.id };
  }

  getMonitor() { return this.monitor; }
  getScorer() { return this.scorer; }
  getRegistry() { return SourceRegistry; }
}

module.exports = new DataCollector();
