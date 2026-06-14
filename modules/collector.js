const { ScraperFactory } = require('../lib/scraper');
const { ContentNormalizer } = require('./normalizer');
const { DedupEngine } = require('./dedup');
const { SourceScorer } = require('./scorer');
const { CollectorMonitor } = require('./monitor');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const sourcesRepo = db.sources;
const rawDataRepo = db.rawData;

class DataCollector {
  constructor() {
    this.lastFetch = {};
    this.minInterval = 15 * 60 * 1000;
    this.dedup = new DedupEngine(db.adapter);
    this.scorer = new SourceScorer(db.adapter);
    this.monitor = new CollectorMonitor(db.adapter);
  }

  _canFetch(key) {
    const last = this.lastFetch[key];
    if (!last) return true;
    return (Date.now() - last) >= this.minInterval;
  }

  _markFetched(key) {
    this.lastFetch[key] = Date.now();
  }

  async collectAll() {
    console.log('[Collector] بدء جمع البيانات...');
    const allSources = sourcesRepo.findAll({ is_active: 1 });
    const results = [];
    let totalDeduped = 0;
    let totalFailed = 0;
    const startTime = Date.now();

    for (const source of allSources) {
      const fetchKey = `${source.type}_${source.id}`;
      if (!this._canFetch(fetchKey)) {
        console.log(`[Collector] ${source.name}: تجاوز (فاصل زمني)`);
        continue;
      }
      try {
        const items = await this._collectFromSource(source);
        results.push(...items.collected);
        totalDeduped += items.deduped;
        totalFailed += items.failed;
        const sourceStart = Date.now();
        const duration = Date.now() - sourceStart;
        this.monitor.logRun({
          status: 'success',
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          itemsCollected: items.collected.length,
          itemsDeduped: items.deduped,
          itemsFailed: items.failed,
          duration,
        });
        sourcesRepo.update(source.id, { last_scraped: new Date().toISOString() });
        this.scorer.updateSourceScore(source);
      } catch (e) {
        console.error(`[Collector] ${source.name} error:`, e.message);
        totalFailed++;
        this.monitor.logRun({
          status: 'failed',
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          error: e.message,
          duration: Date.now() - startTime,
        });
      }
      this._markFetched(fetchKey);
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
    const source = sourcesRepo.findOne(s => s.type === 'facebook');
    if (!source) return [];
    if (!this._canFetch('facebook')) return [];
    const result = await this._collectFromSource(source);
    this._markFetched('facebook');
    return result.collected;
  }

  async collectMinistry() {
    const source = sourcesRepo.findOne(s => s.type === 'web');
    if (!source) return [];
    if (!this._canFetch('ministry')) return [];
    const result = await this._collectFromSource(source);
    this._markFetched('ministry');
    return result.collected;
  }

  async collectManual(data) {
    const source = sourcesRepo.findOne(s => s.type === 'manual');
    const normalized = ContentNormalizer.normalize(data, source);
    const rawText = JSON.stringify(normalized || data);
    const hash = uuidv4().replace(/-/g, '').slice(0, 16);
    const record = rawDataRepo.create({
      source_id: source?.id || 3,
      raw_text: rawText,
      content_hash: hash,
      status: 'pending',
    });
    return { ...(normalized || data), hash, raw_id: record.id };
  }

  getMonitor() { return this.monitor; }

  getScorer() { return this.scorer; }
}

module.exports = new DataCollector();
