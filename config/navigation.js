const navItems = [
  { id: 'home', label: 'الرئيسية', icon: '🏠', path: '/', category: null, meta: { title: 'الصوت المحلي - الرئيسية', description: 'منصة جهوية للإعلام العام والتنمية المحلية - ولاية تيارت' } },
  { id: 'event', label: 'حدث', icon: '📰', path: '/section/event', category: 'event', meta: { title: 'الأخبار العاجلة - الصوت المحلي', description: 'آخر الأخبار العاجلة والمستجدات في ولاية تيارت والجزائر' } },
  { id: 'national', label: 'وطني', icon: '🇩🇿', path: '/section/national', category: 'national', meta: { title: 'أخبار وطنية - الصوت المحلي', description: 'الأخبار الوطنية الجزائرية والمستجدات السياسية والاقتصادية' } },
  { id: 'region', label: 'أخبار المنطقة', icon: '📍', path: '/section/region', category: 'regional-news', meta: { title: 'أخبار المنطقة - الصوت المحلي', description: 'أخبار بلديات ولاية تيارت: عين كرمس، فرندة، السوقر، مهدية' } },
  { id: 'society', label: 'مجتمع', icon: '👥', path: '/section/society', category: 'society', meta: { title: 'مجتمع - الصوت المحلي', description: 'قضايا المجتمع المحلي والشؤون الاجتماعية في تيارت' } },
  { id: 'culture', label: 'ثقافة', icon: '🎭', path: '/section/culture', category: 'culture', meta: { title: 'ثقافة - الصوت المحلي', description: 'الفنون والثقافة والتراث في ولاية تيارت' } },
  { id: 'sports', label: 'رياضة', icon: '⚽', path: '/section/sports', category: 'sports', meta: { title: 'رياضة - الصوت المحلي', description: 'أخبار الرياضة المحلية والوطنية' } },
  { id: 'development', label: 'التنمية', icon: '🌱', path: '/section/development', category: 'development', meta: { title: 'التنمية - الصوت المحلي', description: 'مشاريع التنمية المحلية والتعمير في تيارت' } },
  { id: 'faces', label: 'وجوه وعبر', icon: '👤', path: '/section/faces', category: 'faces-stories', meta: { title: 'وجوه وعبر - الصوت المحلي', description: 'قصص شخصيات ملهمة وتجارب إنسانية من المجتمع' } },
  { id: 'ads', label: 'إعلانات', icon: '📢', path: '/section/ads', category: 'advertisements', meta: { title: 'إعلانات - الصوت المحلي', description: 'الإعلانات الرسمية والتبليغات الإدارية' } },
  { id: 'archive', label: 'الأرشيف', icon: '📚', path: '/archive', category: null, meta: { title: 'الأرشيف - الصوت المحلي', description: 'أرشيف المقالات والأخبار السابقة' } },
];

const regionalSubmenu = [
  { id: 'ain-kermes', label: 'عين كرمس', region: 'عين كرمس' },
  { id: 'tiaret', label: 'تيارت', region: 'تيارت' },
  { id: 'frenda', label: 'فرندة', region: 'فرندة' },
  { id: 'sougueur', label: 'السوقر', region: 'السوقر' },
  { id: 'mahdia', label: 'مهدية', region: 'مهدية' },
];

const categoryToSlug = {
  'event': 'event',
  'national': 'national',
  'regional-news': 'region',
  'society': 'society',
  'culture': 'culture',
  'sports': 'sports',
  'development': 'development',
  'faces-stories': 'faces',
  'advertisements': 'ads',
};

const slugToCategory = {
  'event': 'event',
  'national': 'national',
  'region': 'regional-news',
  'society': 'society',
  'culture': 'culture',
  'sports': 'sports',
  'development': 'development',
  'faces': 'faces-stories',
  'ads': 'advertisements',
};

function getNavItemById(id) {
  return navItems.find(item => item.id === id) || null;
}

function getCategoryForSlug(slug) {
  return slugToCategory[slug] || slug || null;
}

module.exports = { navItems, regionalSubmenu, categoryToSlug, slugToCategory, getNavItemById, getCategoryForSlug };
