const db = require('../database');
const { ArticleRepository } = require('../lib/repositories/article-repository');
const EditorialClassifier = require('./classifier');
const FactValidator = require('./fact-validator');

const articles = new ArticleRepository(db.adapter);
const classifier = new EditorialClassifier();
const factValidator = new FactValidator();

class ContentAnalyzer {
  _preprocess(text) {
    if (!text) return '';
    return text
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _computeTextSimilarity(hash1, hash2) {
    if (!hash1 || !hash2) return 0;
    const bigrams = (s) => {
      const b = new Set();
      for (let i = 0; i < s.length - 1; i++) b.add(s.substring(i, i + 2));
      return b;
    };
    const b1 = bigrams(hash1);
    const b2 = bigrams(hash2);
    if (b1.size === 0 || b2.size === 0) return 0;
    const intersection = new Set([...b1].filter(x => b2.has(x)));
    return intersection.size / Math.max(b1.size, b2.size);
  }

  _detectDuplicate(body, title) {
    if (!body) return { isDuplicate: false, similarity: 0 };
    const existing = articles.findAll();
    for (const item of existing) {
      const bodySim = this._computeTextSimilarity(body.slice(0, 200), (item.body || '').slice(0, 200));
      const titleSim = title && item.title ? this._computeTextSimilarity(title, item.title) : 0;
      const maxSim = Math.max(bodySim, titleSim);
      if (maxSim > 0.75) {
        return { isDuplicate: true, similarity: Math.round(maxSim * 100), existingId: item.id, existingTitle: item.title };
      }
    }
    return { isDuplicate: false, similarity: 0 };
  }

  _detectUrgency(text) {
    const urgent = ['عاجل', 'هام', 'ضروري', 'تنبيه', 'مستعجل', 'فوري', 'آخر أجل', 'اليوم', 'غداً'];
    const count = urgent.filter(w => (text || '').includes(w)).length;
    if (count >= 2) return 1.0;
    if (count === 1) return 0.7;
    return 0.3;
  }

  _extractSummary(text) {
    if (!text) return '';
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/[.،\n]/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      if (words.length >= 10) {
        return words.slice(0, 45).join(' ') + (words.length > 45 ? '...' : '');
      }
    }
    const words = cleaned.split(/\s+/);
    return words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');
  }

  _getSourceTrust(sourceName) {
    const SourceRegistry = require('./source-registry');
    const entry = SourceRegistry.findByName(sourceName);
    if (entry && entry.reliability_score) return entry.reliability_score;
    const trustMap = {
      'وزارة التربية الوطنية': 0.95,
      'وزارة التربية': 0.95,
      'مديرية التربية': 0.85,
      'إدارة الثانوية': 0.90,
      'صفحة الفيسبوك الرسمية': 0.70,
    };
    for (const [key, trust] of Object.entries(trustMap)) {
      if ((sourceName || '').includes(key)) return trust;
    }
    return 0.65;
  }

  async analyzeRawData(rawDataId) {
    const raw = db.rawData.findById(rawDataId);
    if (!raw) return null;

    let data;
    try { data = JSON.parse(raw.raw_text); } catch {
      data = { body: raw.raw_text, title: 'عنوان غير معروف', source: 'غير معروف' };
    }

    const body = data.body || '';

    const dupCheck = this._detectDuplicate(body, data.title);
    if (dupCheck.isDuplicate) {
      db.rawData.update(rawDataId, { status: 'processed' });
      db.adapter.create('ai_decision_log', {
        content_id: -1,
        decision_type: 'duplicate_rejected',
        input_data: JSON.stringify({ raw_id: rawDataId }),
        output_data: JSON.stringify(dupCheck),
        model_version: 'classifier-v1',
        confidence: dupCheck.similarity / 100,
        human_reviewed: 0,
      });
      return { duplicate: true, ...dupCheck };
    }

    // 1. Classify using new 9-category classifier
    const classification = classifier.classify(body);

    // 2. Fact validation using new FactValidator
    const factCheck = factValidator.validate(
      { body, source_name: data.source, source_url: data.source_url, event_date: data.event_date, title: data.title },
      { rawId: rawDataId }
    );

    // 3. Urgency detection
    const urgency = this._detectUrgency(body);

    // 4. Source trust (from registry or fallback)
    const sourceTrust = this._getSourceTrust(data.source);

    // 5. Overall weighted score
    const overall = Math.round(
      (classification.confidence * 0.20 +
       factCheck.score * 0.30 +
       sourceTrust * 0.25 +
       urgency * 0.15 +
       (factCheck.passed ? 0.10 : 0)) * 100
    ) / 100;

    // 6. Summary
    const summary = this._extractSummary(body);

    // 7. Status based on overall
    let status;
    if (overall >= 0.8) status = 'draft';
    else if (overall >= 0.5) status = 'review';
    else if (overall >= 0.3) status = 'review';
    else status = 'rejected';

    // 8. Importance
    let importance;
    if (urgency >= 0.7 || (factCheck.score >= 0.8 && sourceTrust >= 0.8)) importance = 'high';
    else if (overall >= 0.5) importance = 'normal';
    else importance = 'low';

    const content = articles.create({
      raw_data_id: rawDataId,
      title: data.title || 'بدون عنوان',
      body: body,
      summary,
      category: classification.category,
      classification_score: classification.confidence,
      fact_check_score: factCheck.score,
      source_trust: sourceTrust,
      urgency_score: urgency,
      importance,
      overall_score: overall,
      status: status,
      source_url: data.source_url || '',
      source_name: data.source || '',
      event_date: data.event_date || null,
      image_url: data.image_url || '',
      image_data: data.image_data || '',
      is_ai_generated: 1,
      writer_version: null,
    });

    db.adapter.create('ai_decision_log', {
      content_id: content.id,
      decision_type: 'classification',
      input_data: JSON.stringify({ text_sample: body.slice(0, 100) }),
      output_data: JSON.stringify({
        category: classification.category,
        category_label: classification.label,
        confidence: classification.confidence,
        per_category_scores: classification.scores,
        factCheck: {
          score: factCheck.score,
          passed: factCheck.passed,
          verdict: factCheck.verdict,
          reasons: factCheck.reasons,
          crossSourceDuplicates: factCheck.crossSourceDuplicates,
        },
        urgency: urgency,
        importance,
        duplicate_check: dupCheck,
        overall: overall,
      }),
      model_version: 'classifier-v1',
      confidence: overall,
      human_reviewed: 0,
    });

    db.rawData.update(rawDataId, { status: 'processed' });
    return { classification, factCheck, overall, summary, importance, duplicate: false };
  }
}

module.exports = new ContentAnalyzer();
