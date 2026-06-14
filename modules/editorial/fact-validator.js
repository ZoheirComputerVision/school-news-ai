const FactValidator = require('../fact-validator');
const db = require('../../database');

class EditorialFactValidator {
  constructor() {
    this.validator = new FactValidator();
  }

  validate(content, sourceInfo = {}) {
    // content: { title, body, source_url, source_name, event_date }
    // sourceInfo: { trust_score, reliability_score, type }
    
    const result = this.validator.validate(content);
    
    // Convert 0-1 to 0-100
    const confidenceScore = Math.round((result.score || 0) * 100);
    
    // Generate validation notes
    const notes = [];
    if (result.passed) {
      notes.push(`اجتاز التحقق بنسبة ${confidenceScore}%`);
    } else {
      notes.push(`لم يجتاز التحقق بالكامل (${confidenceScore}%)`);
    }
    if (result.reasons && result.reasons.length > 0) {
      result.reasons.slice(0, 3).forEach(r => notes.push(r));
    }
    if (result.verdict) {
      notes.push(`الحكم: ${result.verdict}`);
    }
    
    return {
      confidence_score: Math.min(100, Math.max(0, confidenceScore)),
      validation_notes: notes,
      supporting_sources: this._findSupportingSources(content)
    };
  }

  _findSupportingSources(content) {
    // Scan existing published/sources for related content
    const sources = [];
    try {
      const allSources = db.adapter.findAll('sources') || [];
      if (content.source_url) {
        const match = allSources.find(s => s.url && content.source_url.includes(s.url));
        if (match) sources.push({ id: match.id, name: match.name, url: match.url });
      }
    } catch (e) {
      // Silently handle — sources might not exist
    }
    return sources;
  }

  getConfidenceLabel(score) {
    if (score >= 71) return 'موثوق';
    if (score >= 41) return 'بحاجة مراجعة';
    return 'مرفوض';
  }
}

module.exports = EditorialFactValidator;
