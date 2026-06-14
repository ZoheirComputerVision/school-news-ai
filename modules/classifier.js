const db = require('../database');

const CATEGORIES = {
  event: {
    label: 'فعاليات',
    strong: ['نظَّمت', 'شارك', 'شاركت', 'شاركوا', 'في إطار', 'بمناسبة', 'احتضنت', 'انطلقت'],
    medium: ['زيارة', 'خرجة', 'نشاط', 'ورشة', 'حفل', 'مسابقة', 'رحلة', 'مخيم', 'ملتقى', 'ندوة'],
    context: ['تلاميذ', 'أساتذة', 'مؤسسة', 'قسم', 'ميدانية', 'تربوية', 'ثقافية', 'مشاركة'],
  },
  national: {
    label: 'أخبار وطنية',
    strong: ['أعلنت', 'صرَّح', 'أكد', 'كشف', 'استنكر', 'ندد', 'رحَّب', 'دعا', 'وزير'],
    medium: ['وزارة', 'نتائج', 'قرار', 'تعليمات', 'مرسوم', 'منشور', 'بلاغ', 'بيان', 'الحكومة'],
    context: ['الوطنية', 'الجزائر', 'الجمهورية', 'رئيس', 'مجلس', 'لجنة', 'ديوان'],
  },
  'regional-news': {
    label: 'أخبار جهوية',
    strong: ['تيارت', 'عين كرمس', 'ولاية', 'المديرية', 'البلدية', 'دائرة'],
    medium: ['محلي', 'إقليمي', 'جهوي', 'المنطقة', 'بلدية', 'مديرية التربية'],
    context: ['الولاية', 'الوالي', 'المحلي', 'المجلس الشعبي', 'مصالح'],
  },
  society: {
    label: 'مجتمع',
    strong: ['تضامن', 'تبرع', 'حملة', 'مساعدة', 'تطوع', 'عمل خيري', 'إحسان'],
    medium: ['مجتمع', 'اجتماعي', 'أسرة', 'عائلة', 'جمعية', 'خيرية', 'تكافل'],
    context: ['فقر', 'محتاج', 'أيتام', 'ذوي', 'همة', 'دعم نفسي', 'استشارة'],
  },
  culture: {
    label: 'ثقافة وفن',
    strong: ['ثقافة', 'فني', 'فن', 'مسرح', 'شعر', 'أدب', 'مكتبة', 'معرض'],
    medium: ['ثقافي', 'فنية', 'أدبية', 'قراءة', 'تراث', 'فلكلور', 'موسيقى'],
    context: ['كتاب', 'رواية', 'قصة', 'إبداع', 'تشكيلي', 'نحت', 'خط', 'عروض'],
  },
  sports: {
    label: 'رياضة',
    strong: ['رياضة', 'رياضي', 'رياضية', 'مباراة', 'بطولة', 'كرة', 'سباق', 'ملعب'],
    medium: ['فريق', 'منافسة', 'دوري', 'كأس', 'تلميذ رياضي', 'حصص رياضية'],
    context: ['تدريب', 'لياقة', 'بدني', 'حركي', 'سباحة', 'جري', 'قفز', 'رمي'],
  },
  development: {
    label: 'تنمية وتطوير',
    strong: ['تنمية', 'تطوير', 'مشروع', 'بناء', 'صيانة', 'تهيئة', 'أشغال'],
    medium: ['برنامج', 'بنية تحتية', 'تجهيزات', 'معدات', 'قاعة', 'مخبر', 'إصلاح'],
    context: ['تحديث', 'تحسين', 'توسعة', 'ترقية', 'عصرنة', 'رقمنة', 'تجهيز'],
  },
  'faces-stories': {
    label: 'شخصيات وقصص',
    strong: ['شخصية', 'قصة', 'نجاح', 'تجربة', 'تميز', 'تكريم', 'مبدع', 'قدوة'],
    medium: ['رحلة', 'إبداع', 'موهبة', 'ناجح', 'ملهم', 'متفوق', 'صاحب قصة'],
    context: ['حكاية', 'مسيرة', 'كفاح', 'تحدي', 'إنجاز', 'أستاذ', 'تلميذ'],
  },
  advertisements: {
    label: 'إعلانات',
    strong: ['يعلن', 'تعلن', 'تنظم', 'تدعو', 'تعلن إدارة', 'فتح', 'تسجيل', 'دعوة'],
    medium: ['مسابقة توظيف', 'أبواب مفتوحة', 'مباراة', 'انتقاء', 'إيداع', 'ملفات', 'مترشح'],
    context: ['على الراغبين', 'آخر أجل', 'تاريخ', 'إلى جميع', 'يرجى', 'المعنيين', 'شروط'],
  },
};

const CATEGORY_ALIASES = {
  news: 'national',
  activity: 'event',
  announcement: 'advertisements',
};

const STRONG_WEIGHT = 0.25;
const MEDIUM_WEIGHT = 0.15;
const CONTEXT_WEIGHT = 0.10;

class EditorialClassifier {
  _preprocess(text) {
    if (!text) return '';
    return text
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9A-Za-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  classify(text) {
    const cleaned = this._preprocess(text);
    if (!cleaned) {
      return { category: 'uncategorized', confidence: 0, scores: {} };
    }

    const scores = {};
    for (const cat of Object.keys(CATEGORIES)) {
      scores[cat] = 0;
    }

    for (const [cat, levels] of Object.entries(CATEGORIES)) {
      for (const word of levels.strong) {
        if (cleaned.includes(word)) scores[cat] += STRONG_WEIGHT;
      }
      for (const word of levels.medium) {
        if (cleaned.includes(word)) scores[cat] += MEDIUM_WEIGHT;
      }
      for (const word of levels.context) {
        if (cleaned.includes(word)) scores[cat] += CONTEXT_WEIGHT;
      }
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const maxCat = sorted[0][0];
    const maxScore = sorted[0][1];
    const secondScore = sorted[1] ? sorted[1][1] : 0;

    let category;
    let confidence;

    if (maxScore >= 0.35) {
      category = maxCat;
      const margin = (maxScore - secondScore) / (maxScore || 1);
      confidence = Math.min(maxScore * 0.7 + 0.25 + margin * 0.1, 0.97);
    } else if (maxScore >= 0.15) {
      category = maxCat;
      confidence = Math.min(maxScore * 0.5 + 0.2, 0.6);
    } else {
      category = 'uncategorized';
      confidence = Math.min(maxScore, 0.3);
    }

    confidence = Math.round(confidence * 100) / 100;

    return {
      category,
      confidence,
      scores,
      label: CATEGORIES[category]?.label || 'غير مصنف',
    };
  }

  resolveAlias(category) {
    return CATEGORY_ALIASES[category] || category;
  }

  getCategories() {
    return Object.entries(CATEGORIES).map(([id, c]) => ({
      id,
      label: c.label,
      keywords: {
        strong: c.strong.length,
        medium: c.medium.length,
        context: c.context.length,
      },
    }));
  }

  getCategoryLabel(categoryId) {
    return CATEGORIES[categoryId]?.label || categoryId;
  }
}

module.exports = EditorialClassifier;
