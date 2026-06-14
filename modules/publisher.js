const db = require('../database');
const { SettingsRepository } = require('../lib/repositories/settings-repository');
const { ArticleRepository } = require('../lib/repositories/article-repository');
const { ArchiveRepository } = require('../lib/repositories/archive-repository');

const MAX_PUBLISH_PER_DAY = 15;

const settingsRepo = new SettingsRepository(db.adapter);
const articles = new ArticleRepository(db.adapter);
const archiveRepo = new ArchiveRepository(db.adapter);

class EditorialPublisher {
  getSetting(key) {
    return settingsRepo.get(key) || 'false';
  }

  _getDailyCount() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = this.getSetting('publish_date');
    if (savedDate !== today) return 0;
    return parseInt(this.getSetting('total_published_today') || '0');
  }

  _checkDailyQuota() {
    const count = this._getDailyCount();
    if (count >= MAX_PUBLISH_PER_DAY) {
      return { allowed: false, reason: `تجاوز الحد اليومي للنشر (${MAX_PUBLISH_PER_DAY})` };
    }
    return { allowed: true };
  }

  _contentQualityCheck(content) {
    const checks = [];
    if (!content.title || content.title.length < 5) checks.push('عنوان قصير جدًا');
    if (content.title && content.title.length > 200) checks.push('عنوان طويل جدًا');
    if (!content.body || content.body.length < 30) checks.push('محتوى قصير جدًا');
    if (content.body && content.body.length > 10000) checks.push('محتوى طويل جدًا');
    if (!content.source_name || content.source_name === 'غير معروف') checks.push('مصدر غير معروف');
    const existing = articles.find(c => c.status === 'published' && c.id !== content.id);
    for (const item of existing) {
      const sim = this._simpleSimilarity(
        (content.body || '').slice(0, 100),
        (item.body || '').slice(0, 100)
      );
      if (sim > 0.8) {
        checks.push(`تشابه قوي (${Math.round(sim * 100)}%) مع منشور #${item.id}`);
        break;
      }
    }
    return {
      passed: checks.length === 0,
      issues: checks,
      score: Math.max(0, 1 - (checks.length * 0.15)),
    };
  }

  _simpleSimilarity(a, b) {
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

  canAutoPublish(content) {
    if (this.getSetting('stop_auto_publish') === 'true') {
      return { allowed: false, reason: '🔴 إيقاف الطوارئ مفعل', level: 'critical' };
    }
    if (this.getSetting('require_human_review') === 'true') {
      return { allowed: false, reason: 'المراجعة البشرية إلزامية', level: 'warning' };
    }
    if (content.category === 'uncategorized') {
      return { allowed: false, reason: 'محتوى غير مصنف - يتطلب مراجعة', level: 'warning' };
    }
    if (content.importance === 'low') {
      return { allowed: false, reason: 'محتوى منخفض الأهمية', level: 'info' };
    }
    const quota = this._checkDailyQuota();
    if (!quota.allowed) {
      return { allowed: false, reason: quota.reason, level: 'warning' };
    }
    if (content.overall_score >= 0.8 && content.fact_check_score >= 0.7) {
      return { allowed: true, reason: `✓ ثقة عالية (${Math.round(content.overall_score * 100)}%)`, level: 'success' };
    }
    if (content.overall_score >= 0.65 && content.source_trust >= 0.85) {
      return { allowed: true, reason: `✓ مصدر موثوق + ثقة متوسطة`, level: 'success' };
    }
    return { allowed: false, reason: `نقاط الثقة ${Math.round(content.overall_score * 100)}% - دون العتبة`, level: 'info' };
  }

  _computePriority(content) {
    let priority = 0;
    if (content.importance === 'high') priority += 3;
    if (content.importance === 'normal') priority += 2;
    if (content.overall_score >= 0.8) priority += 2;
    else if (content.overall_score >= 0.5) priority += 1;
    if (content.urgency_score >= 0.7) priority += 2;
    if (content.source_trust >= 0.85) priority += 1;
    return priority;
  }

  getQueue() {
    const queue = articles.find(c => c.status === 'review' || c.status === 'draft')
      .map(c => ({
        ...c,
        queue_priority: this._computePriority(c),
      }))
      .sort((a, b) => {
        if (b.queue_priority !== a.queue_priority) return b.queue_priority - a.queue_priority;
        return (b.overall_score || 0) - (a.overall_score || 0);
      });
    return queue;
  }

  async publish(contentId) {
    const content = articles.findById(contentId);
    if (!content) return { success: false, error: 'المحتوى غير موجود' };
    if (content.status === 'published') return { success: false, error: 'منشور مسبقًا', duplicate: true };

    const qualityCheck = this._contentQualityCheck(content);
    if (!qualityCheck.passed) {
      articles.update(contentId, { status: 'review' });
      this.logDecision(contentId, 'quality_check_failed', qualityCheck);
      return { success: false, method: 'quality_blocked', reason: qualityCheck.issues.join('، '), message: 'فحص الجودة: لم يجتز' };
    }

    const check = this.canAutoPublish(content);

    if (check.allowed) {
      articles.update(contentId, {
        status: 'published',
        published_at: new Date().toISOString(),
      });
      db.adapter.saveNow('processed_content');
      this._updateDailyCount();
      this.logDecision(contentId, 'auto_publish', check);
      this._archive(contentId, 'auto_published');
      return { success: true, method: 'auto', message: 'نشر تلقائي ✓' };
    }

    const levelWeights = { critical: 'urgent', warning: 'normal', info: 'low' };
    const reviewPriority = levelWeights[check.level] || 'normal';
    articles.update(contentId, {
      status: 'review',
      review_priority: reviewPriority,
    });
    this.logDecision(contentId, 'pending_review', { ...check, reviewPriority });
    return { success: false, method: 'pending', reason: check.reason, message: `أحيل للمراجعة (${reviewPriority})` };
  }

  async approveManual(contentId, reviewer = 'admin') {
    const content = articles.findById(contentId);
    if (!content) return { success: false, error: 'غير موجود' };

    const qualityCheck = this._contentQualityCheck(content);
    if (!qualityCheck.passed) {
      return { success: false, error: 'المحتوى لا يجتاز فحص الجودة', issues: qualityCheck.issues };
    }

    articles.update(contentId, {
      status: 'published',
      published_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
    });

    db.adapter.saveNow('processed_content');
    this._updateDailyCount();
    this.logDecision(contentId, 'manual_approve', { reviewer });
    this._archive(contentId, 'manual_approved');
    return { success: true, method: 'manual', message: 'تم النشر بعد المراجعة البشرية ✓' };
  }

  async reject(contentId, reason = 'مرفوض من المشرف', reviewer = 'admin') {
    articles.update(contentId, {
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
      rejection_reason: reason,
    });
    db.adapter.saveNow('processed_content');
    this.logDecision(contentId, 'rejected', { reason, reviewer });
    this._archive(contentId, 'rejected');
    return { success: true, message: 'تم الرفض والأرشفة' };
  }

  getGovernanceLog(options = {}) {
    const { limit = 50, offset = 0, contentId } = options;
    let logs = db.adapter.findAll('ai_decision_log');
    if (contentId) logs = logs.filter(l => l.content_id === contentId);

    const enriched = logs
      .sort((a, b) => (b.created_at || '').localeCompare((a.created_at || '')))
      .map(log => {
        let inputData, outputData;
        try { inputData = JSON.parse(log.input_data || '{}'); } catch { inputData = {}; }
        try { outputData = JSON.parse(log.output_data || '{}'); } catch { outputData = {}; }
        const content = log.content_id > 0 ? articles.findById(log.content_id) : null;
        return {
          id: log.id,
          contentId: log.content_id,
          title: content ? content.title : null,
          decisionType: log.decision_type,
          modelVersion: log.model_version,
          confidence: log.confidence,
          humanReviewed: log.human_reviewed,
          createdAt: log.created_at,
          input: inputData,
          output: outputData,
        };
      });
    const total = enriched.length;
    return {
      items: enriched.slice(offset, offset + limit),
      total,
    };
  }

  getGovernanceSummary() {
    const allContent = articles.findAll();
    const logs = db.adapter.findAll('ai_decision_log');

    const byDecisionType = {};
    for (const log of logs) {
      byDecisionType[log.decision_type] = (byDecisionType[log.decision_type] || 0) + 1;
    }

    const byCategory = {};
    const byScoreRange = { high: 0, medium: 0, low: 0 };
    for (const c of allContent) {
      const cat = c.category || 'uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      if (c.overall_score >= 0.7) byScoreRange.high++;
      else if (c.overall_score >= 0.4) byScoreRange.medium++;
      else byScoreRange.low++;
    }

    const totalContent = allContent.length;
    const avgScore = totalContent > 0
      ? Math.round(allContent.reduce((s, c) => s + (c.overall_score || 0), 0) / totalContent * 100) / 100
      : 0;

    return {
      totalDecisions: logs.length,
      totalContent,
      averageOverallScore: avgScore,
      byDecisionType,
      byCategory,
      byScoreRange,
      autoPublishRate: logs.filter(l => l.decision_type === 'auto_publish').length,
      rejectionRate: logs.filter(l => l.decision_type === 'rejected').length,
      humanReviewRate: logs.filter(l => l.human_reviewed === 1).length,
    };
  }

  _archive(contentId, reason) {
    const content = articles.findById(contentId);
    if (!content) return;
    archiveRepo.archiveContent(contentId, reason);
  }

  _updateDailyCount() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = this.getSetting('publish_date');
    if (savedDate !== today) {
      settingsRepo.set('publish_date', today);
      settingsRepo.set('total_published_today', '1');
    } else {
      const current = parseInt(this.getSetting('total_published_today') || '0');
      settingsRepo.set('total_published_today', String(current + 1));
    }
  }

  logDecision(contentId, type, data) {
    articles.logDecision(contentId, type, data);
  }
}

module.exports = new EditorialPublisher();
