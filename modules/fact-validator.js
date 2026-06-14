const db = require('../database');
const SourceRegistry = require('./source-registry');

class FactValidator {
  validate(content, options = {}) {
    let score = 0.5;
    const reasons = [];

    if (!content || !content.body) {
      return { score: 0, passed: false, verdict: 'مرفوض ✗', reasons: ['محتوى فارغ'], crossSourceDuplicates: [] };
    }

    const body = content.body || '';
    const sourceName = content.source_name || content.source || '';
    const sourceUrl = content.source_url || '';

    // 1. Source reputation from Source Registry
    const sourceEntry = SourceRegistry.findByName(sourceName) || SourceRegistry.findByUrl(sourceUrl);
    if (sourceEntry) {
      const sourceWeight = (sourceEntry.reliability_score || 0.5) * 0.25;
      score += sourceWeight;
      reasons.push(`مصدر مسجل: ${sourceEntry.name} (موثوقية ${Math.round(sourceEntry.reliability_score * 100)}%)`);
    }

    // 2. Official source boost
    if (sourceUrl && (
      sourceUrl.includes('education.gov.dz') ||
      sourceUrl.includes('douane.gov.dz') ||
      sourceUrl.includes('mjs.gov.dz')
    )) {
      score += 0.15;
      reasons.push('مصدر حكومي رسمي');
    }

    // 3. School reference check
    const schoolRefs = ['الصوت المحلي', 'عين كرمس', 'تيارت', 'ولاية'];
    const refCount = schoolRefs.filter(r => body.includes(r)).length;
    if (refCount >= 2) {
      score += 0.1;
      reasons.push('يحتوي مراجع المؤسسة');
    }

    // 4. Date validation
    if (content.event_date) {
      const d = new Date(content.event_date);
      const now = new Date();
      const schoolStart = new Date('2023-09-01');
      if (d > now) {
        score -= 0.4;
        reasons.push('تاريخ مستقبلي');
      } else if (d < schoolStart) {
        score -= 0.3;
        reasons.push('تاريخ قبل افتتاح الثانوية');
      } else {
        score += 0.05;
        reasons.push('تاريخ صحيح');
      }
    } else {
      score -= 0.05;
      reasons.push('بدون تاريخ');
    }

    // 5. Content quality (length)
    if (body.length > 200) {
      score += 0.1;
      reasons.push('محتوى مفصل');
    } else if (body.length > 100) {
      score += 0.05;
      reasons.push('محتوى متوسط');
    } else if (body.length < 30) {
      score -= 0.15;
      reasons.push('محتوى قصير جدًا');
    }

    // 6. Named entities (people)
    const titles = ['أستاذ', 'مدير', 'مستشار', 'ناظر', 'أستاذة', 'السيد', 'السيدة', 'الدكتور', 'الأستاذ'];
    if (titles.some(t => body.includes(t))) {
      score += 0.05;
      reasons.push('يحتوي أسماء شخصيات');
    }

    // 7. Content without details penalty
    if (body.length > 50 && body.length < 100 && !content.event_date) {
      score -= 0.1;
      reasons.push('محتوى بدون تاريخ');
    }

    // 8. Cross-source duplicate detection
    const crossDups = this._findCrossSourceDuplicates(body, content);
    if (crossDups.length > 0) {
      const maxSim = Math.max(...crossDups.map(d => d.similarity));
      if (maxSim > 0.8) {
        score += 0.15;
        reasons.push(`متطابق مع ${crossDups.length} مصدر آخر - يزيد الثقة`);
      } else if (maxSim > 0.5) {
        score += 0.08;
        reasons.push(`تشابه جزئي مع مصادر أخرى`);
      }
    }

    score = Math.max(0, Math.min(1, Math.round(score * 100) / 100));

    let verdict;
    if (score >= 0.8) verdict = 'موثوق ✓';
    else if (score >= 0.5) verdict = 'بحاجة مراجعة ⚠️';
    else verdict = 'مرفوض ✗';

    return {
      score,
      passed: score >= 0.5,
      verdict,
      reasons,
      crossSourceDuplicates: crossDups,
    };
  }

  _findCrossSourceDuplicates(body, content) {
    const allContent = db.adapter.findAll('processed_content') || [];
    const results = [];
    for (const item of allContent) {
      if (content.id && item.id === content.id) continue;
      if (!item.body) continue;
      const sim = this._computeSimilarity(
        (body || '').slice(0, 200),
        (item.body || '').slice(0, 200)
      );
      if (sim > 0.5) {
        results.push({
          contentId: item.id,
          title: item.title,
          sourceName: item.source_name,
          similarity: Math.round(sim * 100) / 100,
        });
      }
    }
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  _computeSimilarity(a, b) {
    if (!a || !b) return 0;
    const bigrams = (s) => {
      const set = new Set();
      for (let i = 0; i < s.length - 1; i++) set.add(s.substring(i, i + 2));
      return set;
    };
    const ba = bigrams(a);
    const bb = bigrams(b);
    if (ba.size === 0 || bb.size === 0) return 0;
    const intersection = new Set([...ba].filter(x => bb.has(x)));
    return intersection.size / Math.max(ba.size, bb.size);
  }
}

module.exports = FactValidator;
