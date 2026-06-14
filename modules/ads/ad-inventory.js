const db = require('../../database');

const ZONES = {
  'homepage-top': { name: 'أعلى الصفحة الرئيسية', width: 728, height: 90, type: 'banner' },
  'homepage-middle': { name: 'وسط الصفحة الرئيسية', width: 728, height: 90, type: 'banner' },
  'homepage-bottom': { name: 'أسفل الصفحة الرئيسية', width: 728, height: 90, type: 'banner' },
  'article-sidebar': { name: 'جانب المقال', width: 300, height: 250, type: 'sidebar' },
  'article-inline': { name: 'داخل المقال', width: 468, height: 60, type: 'inline' },
  'archive-page': { name: 'صفحة الأرشيف', width: 728, height: 90, type: 'banner' },
};

class AdInventory {
  getZones() { return ZONES; }

  getZone(zoneId) { return ZONES[zoneId] || null; }

  getActiveAds() {
    try {
      const campaigns = db.adapter.findAll('campaigns') || [];
      const now = new Date();
      return campaigns.filter(c => {
        if (c.status !== 'active') return false;
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return now >= start && now <= end;
      });
    } catch { return []; }
  }

  getAdsForZone(zoneId) {
    const active = this.getActiveAds();
    return active.filter(a => a.target_zone === zoneId);
  }

  hasActiveAds(zoneId) {
    return this.getAdsForZone(zoneId).length > 0;
  }

  getAdPayload(zoneId) {
    const ads = this.getAdsForZone(zoneId);
    if (!ads.length) return null;
    const ad = ads[Math.floor(Math.random() * ads.length)];
    const advertisers = db.adapter.findAll('advertisers') || [];
    const advertiser = advertisers.find(a => a.id === ad.advertiser_id);
    return {
      id: ad.id,
      title: ad.title,
      advertiser: advertiser ? advertiser.company_name : '',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      zone: zoneId,
      zone_info: ZONES[zoneId] || {},
    };
  }
}

module.exports = AdInventory;
