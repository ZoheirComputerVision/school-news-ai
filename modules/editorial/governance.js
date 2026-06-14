const db = require('../../database');

class EditorialGovernance {
  getAuditTrail(itemId = null, limit = 50) {
    try {
      let logs = db.adapter.findAll('editorial_audit') || [];
      if (itemId) {
        logs = logs.filter(l => l.editorial_item_id === itemId);
      }
      return logs
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, limit)
        .map(log => ({
          ...log,
          details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
        }));
    } catch {
      return [];
    }
  }

  getItemDecisionChain(itemId) {
    // Returns all decisions for a specific editorial item + the item itself
    const item = db.adapter.getById('editorial_items', itemId);
    const logs = this.getAuditTrail(itemId);
    return { item, decisions: logs };
  }

  getSummary() {
    try {
      const items = db.adapter.findAll('editorial_items') || [];
      const logs = db.adapter.findAll('editorial_audit') || [];
      
      const byCategory = {};
      const byConfidence = { low: 0, medium: 0, high: 0 };
      
      items.forEach(item => {
        const cat = item.category || 'uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
        
        const score = parseFloat(item.confidence_score) || 0;
        if (score >= 71) byConfidence.high++;
        else if (score >= 41) byConfidence.medium++;
        else byConfidence.low++;
      });
      
      // Count actions by type
      const byAction = {};
      logs.forEach(l => {
        byAction[l.action] = (byAction[l.action] || 0) + 1;
      });
      
      return {
        total_items: items.length,
        total_decisions: logs.length,
        by_category: byCategory,
        by_confidence: byConfidence,
        by_action: byAction,
        status_breakdown: {
          pending: items.filter(i => i.status === 'pending').length,
          approved: items.filter(i => i.status === 'approved').length,
          rejected: items.filter(i => i.status === 'rejected').length,
          published: items.filter(i => i.status === 'published').length,
        },
      };
    } catch {
      return { total_items: 0, total_decisions: 0, by_category: {}, by_confidence: {}, by_action: {}, status_breakdown: {} };
    }
  }

  getAllItems(limit = 50) {
    try {
      return (db.adapter.findAll('editorial_items') || [])
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, limit);
    } catch {
      return [];
    }
  }
}

module.exports = EditorialGovernance;
