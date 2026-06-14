const db = require('../database');
const { ArticleRepository } = require('../lib/repositories/article-repository');
const EditorialClassifier = require('./classifier');

const articles = new ArticleRepository(db.adapter);
const classifier = new EditorialClassifier();

const FOOTER_AI = '\n\n—\n🖋 تم إنتاج هذا المحتوى بمساعدة تقنيات الذكاء الاصطناعي. يخضع هذا المحتوى للمراجعة الآلية والبشرية قبل وبعد النشر.';
const FOOTER_OFFICIAL = '\n\n—\n📝 محتوى رسمي معتمد من إدارة ثانوية المجاهد خليل محمد.';
const COPYRIGHT = `\n© ${new Date().getFullYear()} ثانوية المجاهد خليل محمد المدعو يوسف - عين كرمس. جميع الحقوق محفوظة.`;

const SCHOOL = 'ثانوية المجاهد خليل محمد المدعو يوسف - عين كرمس (تيارت)';

class EditorialWriter {
  _cleanTitle(title, category) {
    if (!title) return 'بدون عنوان';
    let cleaned = title
      .replace(/^[📰📸📢📌🔹🔸▪️•●✓✗⚠️❗❓]+/g, '')
      .replace(/\s*\|\s*/g, ' | ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 120) cleaned = cleaned.slice(0, 117) + '...';
    return cleaned;
  }

  _generateSlug(title) {
    if (!title) return 'untitled';
    return title
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 80) || 'untitled';
  }

  _generateTags(content) {
    const tags = new Set();
    const body = (content.body || '') + ' ' + (content.title || '');
    const tagMap = {
      'تيارت': ['تيارت', 'عين كرمس'],
      'الجزائر': ['الجزائر', 'وطني'],
      'وزارة': ['وزارة التربية', 'تعليم'],
      'تلاميذ': ['تلاميذ', 'طلاب'],
      'أساتذة': ['أساتذة', 'أساتذة'],
      'بكالوريا': ['بكالوريا', 'امتحانات'],
      'رياضة': ['رياضة', 'رياضي'],
      'ثقافة': ['ثقافة', 'فن'],
    };
    for (const [keyword, tagList] of Object.entries(tagMap)) {
      if (body.includes(keyword)) tagList.forEach(t => tags.add(t));
    }
    tags.add('ثانوية المجاهد خليل محمد');
    tags.add('عين كرمس');
    if (content.category && content.category !== 'uncategorized') {
      tags.add(classifier.getCategoryLabel(content.category));
    }
    return Array.from(tags).slice(0, 8);
  }

  _generateMetaDescription(content) {
    if (content.summary && content.summary.length > 20) {
      return content.summary.slice(0, 160);
    }
    const body = (content.body || '').replace(/\s+/g, ' ').trim();
    const words = body.split(/\s+/);
    return words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
  }

  generateArticle(content) {
    const templates = {
      event: this._eventTemplate.bind(this),
      national: this._nationalTemplate.bind(this),
      'regional-news': this._regionalNewsTemplate.bind(this),
      society: this._societyTemplate.bind(this),
      culture: this._cultureTemplate.bind(this),
      sports: this._sportsTemplate.bind(this),
      development: this._developmentTemplate.bind(this),
      'faces-stories': this._facesStoriesTemplate.bind(this),
      advertisements: this._advertisementsTemplate.bind(this),
    };
    const generator = templates[content.category] || this._nationalTemplate.bind(this);
    const article = generator(content);
    const seo = this.generateSEO(content);
    return { article, seo };
  }

  generateSEO(content) {
    const title = this._cleanTitle(content.title, content.category);
    return {
      metaDescription: this._generateMetaDescription(content),
      tags: this._generateTags(content),
      slug: this._generateSlug(title),
      canonicalTitle: title,
    };
  }

  _buildLead(data, category) {
    const date = data.event_date ? `في ${data.event_date}، ` : '';
    const source = data.source_name ? `حسب ما ورد عن ${data.source_name}، ` : '';
    if (category === 'national' || category === 'regional-news') return `${date}${source}علمت الجريدة المدرسية أن ${SCHOOL} ${(data.body || '').slice(0, 60)}...`;
    if (category === 'advertisements') return `${source}صدر عن إدارة ${SCHOOL} الإعلان التالي:`;
    if (category === 'event') return `${date}في إطار النشاطات التربوية، نظمت ${SCHOOL} `;
    if (category === 'faces-stories') return `${date}في إطار التعريف بالكفاءات، ${SCHOOL} `;
    return `${date}${source}`;
  }

  _eventTemplate(data) {
    const title = this._cleanTitle(data.title, 'event');
    const meta = `📆 ${data.event_date || 'تاريخ غير محدد'}`;
    return `${title}\n\n${meta}\n\nفي إطار النشاطات التربوية والثقافية التي تنظمها ${SCHOOL}، وتجسيدًا لبرنامجها السنوي للأنشطة، ${data.body || ''}\n\nتهدف هذه النشاطات إلى صقل مواهب التلاميذ وتنمية مهاراتهم المعرفية والاجتماعية، وتعزيز روح المواطنة والانتماء لديهم.${FOOTER_AI}${COPYRIGHT}`;
  }

  _nationalTemplate(data) {
    const title = this._cleanTitle(data.title, 'national');
    const meta = `🗓 ${data.event_date || 'تاريخ غير محدد'} | 📡 المصدر: ${data.source_name || 'غير محدد'}`;
    const body = data.body || '';
    const sentences = body.split(/[.\n]/).filter(s => s.trim());
    const lead = sentences.slice(0, 2).join('. ') + '.';
    const details = sentences.slice(2).join('. ');
    return `${title}\n\n${meta}\n\n${lead}\n\n${details ? `تفاصيل إضافية:\n${details}` : ''}\n\nيُشار إلى أن هذه المعلومات وردت من المصادر المتاحة وتمت معالجتها آليًا لنشرها في الجريدة المدرسية الذكية لثانوية المجاهد خليل محمد.${FOOTER_AI}${COPYRIGHT}`;
  }

  _regionalNewsTemplate(data) {
    const title = this._cleanTitle(data.title, 'regional-news');
    const meta = `📍 ${data.event_date || 'تاريخ غير محدد'} | ${data.source_name || 'غير محدد'}`;
    return `${title}\n\n${meta}\n\n${data.body || ''}\n\nهذا وتواصل الجريدة المدرسية متابعتها للأخبار المحلية بمنطقة عين كرمس وتيارت.${FOOTER_AI}${COPYRIGHT}`;
  }

  _societyTemplate(data) {
    const title = this._cleanTitle(data.title, 'society');
    return `${title}\n\nفي إطار المبادرات المجتمعية والإنسانية، ${data.body || ''}\n\nتعكس هذه المبادرات الوعي الاجتماعي لأبناء المنطقة وتجسد قيم التضامن والتكافل.${FOOTER_AI}${COPYRIGHT}`;
  }

  _cultureTemplate(data) {
    const title = this._cleanTitle(data.title, 'culture');
    return `${title}\n\nفي إطار الحركة الثقافية والفنية، ${data.body || ''}\n\nيأتي هذا في سياق تعزيز الهوية الثقافية والتراثية والحفاظ على الموروث الفني والأدبي.${FOOTER_AI}${COPYRIGHT}`;
  }

  _sportsTemplate(data) {
    const title = this._cleanTitle(data.title, 'sports');
    return `${title}\n\nفي إطار الأنشطة الرياضية، ${data.body || ''}\n\nتسعى المؤسسة إلى تشجيع الرياضة المدرسية وغرس قيم التنافس الشريف والعمل الجماعي.${FOOTER_AI}${COPYRIGHT}`;
  }

  _developmentTemplate(data) {
    const title = this._cleanTitle(data.title, 'development');
    return `${title}\n\nفي إطار مشاريع التطوير والتحسين، ${data.body || ''}\n\nتأتي هذه المشاريع ضمن رؤية المؤسسة لتوفير بيئة تعليمية ملائمة وتحسين الخدمات المقدمة.${FOOTER_AI}${COPYRIGHT}`;
  }

  _facesStoriesTemplate(data) {
    const title = this._cleanTitle(data.title, 'faces-stories');
    return `${title}\n\nضمن سلسلة "شخصيات وقصص" التي تقدمها الجريدة المدرسية، ${data.body || ''}\n\nقصص النجاح والإبداع هي مصدر إلهام للأجيال، ونسعى دائمًا لتسليط الضوء عليها.${FOOTER_AI}${COPYRIGHT}`;
  }

  _advertisementsTemplate(data) {
    const title = this._cleanTitle(data.title, 'advertisements');
    const meta = `📅 ${data.event_date || 'تاريخ غير محدد'}`;
    return `${title}\n\n${meta}\n\nإدارة ${SCHOOL}\n\n${data.body || ''}\n\n🔹 على جميع المعنيين التقيد بالشروط والآجال المحددة.\n🔹 للمزيد من المعلومات، يرجى التوجه إلى إدارة الثانوية أو الاتصال بها خلال أوقات العمل الرسمية.${FOOTER_OFFICIAL}${COPYRIGHT}`;
  }

  async generateForContent(contentId) {
    const content = articles.findById(contentId);
    if (!content) return null;

    const result = this.generateArticle({
      title: content.title,
      body: content.body,
      summary: content.summary,
      category: content.category,
      event_date: content.event_date,
      source_name: content.source_name,
    });

    const now = new Date().toISOString();
    articles.update(contentId, {
      body: result.article,
      writer_version: 'writer-v2',
      is_ai_generated: 1,
    });

    db.adapter.create('ai_decision_log', {
      content_id: contentId,
      decision_type: 'content_generation',
      input_data: JSON.stringify({ title: content.title, category: content.category, length: content.body?.length }),
      output_data: JSON.stringify({
        article_length: result.article.length,
        seo: result.seo,
      }),
      model_version: 'writer-v2',
      confidence: 0.92,
      human_reviewed: 0,
    });

    return result.article;
  }
}

module.exports = new EditorialWriter();
