const EditorialWriter = require('../writer');
const db = require('../../database');

class EditorialAIWriter {
  constructor() {
    this.writer = EditorialWriter; // existing instance
  }

  generate(rawContent, classification) {
    // rawContent: { id, title, body, source_name, source_url, event_date }
    // classification: { category, confidence, reasoning }
    
    // Prepare content object for the existing writer
    const content = {
      id: rawContent.id,
      title: rawContent.title || 'بدون عنوان',
      body: rawContent.body || '',
      category: classification.category || 'uncategorized',
      summary: rawContent.summary || '',
      source_name: rawContent.source_name || '',
      source_url: rawContent.source_url || '',
      event_date: rawContent.event_date || '',
    };

    // Use existing writer to generate article and SEO
    const generated = this.writer.generateArticle(content);
    const seo = this.writer.generateSEO(content);
    
    return {
      headline: content.title,
      summary: seo.metaDescription || content.summary || content.body.slice(0, 150),
      article: generated.article || content.body,
      tags: seo.tags || [],
      seo_title: seo.canonicalTitle || content.title,
      seo_description: seo.metaDescription || '',
    };
  }

  async generateForRawData(rawDataId) {
    // Fetch raw data
    const rawData = db.adapter.getById('raw_data', rawDataId);
    if (!rawData) throw new Error(`Raw data ${rawDataId} not found`);
    
    let parsed;
    try {
      parsed = typeof rawData.raw_text === 'string' ? JSON.parse(rawData.raw_text) : rawData.raw_text;
    } catch {
      throw new Error(`Cannot parse raw_text for ${rawDataId}`);
    }
    
    const classifier = new (require('./classifier'))();
    const classification = classifier.classify(parsed);
    
    return this.generate({ ...parsed, id: rawData.id }, classification);
  }
}

module.exports = EditorialAIWriter;
