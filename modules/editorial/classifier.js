const EditorialClassifier = require('../classifier');
const db = require('../../database');

class EditorialContentClassifier {
  constructor() {
    this.classifier = new EditorialClassifier();
  }

  classify(rawContent) {
    // rawContent should have at least { title, body }
    const text = `${rawContent.title || ''} ${rawContent.body || ''}`;
    const result = this.classifier.classify(text);
    
    return {
      category: result.category,      // one of: event, national, regional-news, society, culture, sports, development, faces-stories, advertisements
      confidence: result.confidence,  // 0-1 scale
      reasoning: this._generateReasoning(result)
    };
  }

  _generateReasoning(result) {
    const reasons = [];
    if (result.scores) {
      const sorted = Object.entries(result.scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      sorted.forEach(([cat, score]) => {
        if (score > 0) reasons.push(`تطابق مع تصنيف "${this.classifier.getCategoryLabel(cat)}" بنسبة ${(score * 100).toFixed(0)}%`);
      });
    }
    if (reasons.length === 0) reasons.push('لم يتم العثور على تطابق كافٍ مع أي تصنيف');
    return reasons.join('؛ ');
  }

  getCategories() {
    return this.classifier.getCategories();
  }
}

module.exports = EditorialContentClassifier;
