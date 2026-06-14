const express = require('express');
const router = express.Router();
const EditorialReviewQueue = require('../modules/editorial/review-queue');
const EditorialGovernance = require('../modules/editorial/governance');
const EditorialContentClassifier = require('../modules/editorial/classifier');
const EditorialFactValidator = require('../modules/editorial/fact-validator');
const EditorialAIWriter = require('../modules/editorial/ai-writer');

const queue = new EditorialReviewQueue();
const governance = new EditorialGovernance();
const classifier = new EditorialContentClassifier();
const factValidator = new EditorialFactValidator();
const aiWriter = new EditorialAIWriter();

// GET pending items
router.get('/pending', (req, res) => {
  const items = queue.getPending(parseInt(req.query.limit) || 20);
  res.json({ items, total: items.length, status: 'pending' });
});

// GET approved items
router.get('/approved', (req, res) => {
  const items = queue.getApproved(parseInt(req.query.limit) || 20);
  res.json({ items, total: items.length, status: 'approved' });
});

// GET rejected items
router.get('/rejected', (req, res) => {
  const items = queue.getRejected(parseInt(req.query.limit) || 20);
  res.json({ items, total: items.length, status: 'rejected' });
});

// POST approve an editorial item
router.post('/approve/:id', (req, res) => {
  try {
    const item = queue.approve(parseInt(req.params.id), req.body.actor || 'admin');
    res.json({ success: true, item });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// POST reject an editorial item
router.post('/reject/:id', (req, res) => {
  try {
    const item = queue.reject(parseInt(req.params.id), req.body.reason || '', req.body.actor || 'admin');
    res.json({ success: true, item });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// GET all editorial items (for governance center)
router.get('/items', (req, res) => {
  const items = governance.getAllItems(parseInt(req.query.limit) || 50);
  res.json({ items, total: items.length });
});

// GET governance summary
router.get('/governance/summary', (req, res) => {
  const summary = governance.getSummary();
  res.json(summary);
});

// GET audit trail for a specific item
router.get('/governance/chain/:itemId', (req, res) => {
  const chain = governance.getItemDecisionChain(parseInt(req.params.itemId));
  res.json(chain);
});

// POST process raw data through the editorial pipeline
router.post('/process/:rawDataId', async (req, res) => {
  try {
    const rawDataId = parseInt(req.params.rawDataId);
    const rawData = require('../database').adapter.getById('raw_data', rawDataId);
    if (!rawData) return res.status(404).json({ success: false, error: 'Raw data not found' });

    let parsed;
    try {
      parsed = typeof rawData.raw_text === 'string' ? JSON.parse(rawData.raw_text) : rawData.raw_text;
    } catch {
      return res.status(400).json({ success: false, error: 'Cannot parse raw_text' });
    }

    // Step 1: Classify
    const classification = classifier.classify(parsed);

    // Step 2: Fact-validate
    const sourceInfo = { source_id: rawData.source_id };
    const validation = factValidator.validate(parsed, sourceInfo);

    // Step 3: Generate article
    const generated = aiWriter.generate(parsed, classification);

    // Step 4: Add to review queue
    const item = await queue.add({
      source_id: rawData.source_id,
      raw_content_id: rawData.id,
      category: classification.category,
      confidence_score: validation.confidence_score,
      headline: generated.headline,
      summary: generated.summary,
      article: generated.article,
      tags: generated.tags,
    });

    res.json({
      success: true,
      item,
      classification,
      validation: { confidence_score: validation.confidence_score, notes: validation.validation_notes },
      generated: { headline: generated.headline, tags: generated.tags },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST process all pending raw data
router.post('/process-all', async (req, res) => {
  try {
    const db = require('../database');
    const pendingRaw = db.adapter.where('raw_data', { status: 'pending' }) || [];
    const results = [];
    
    for (const raw of pendingRaw.slice(0, 5)) {
      try {
        let parsed;
        try {
          parsed = typeof raw.raw_text === 'string' ? JSON.parse(raw.raw_text) : raw.raw_text;
        } catch {
          continue;
        }

        const classification = classifier.classify(parsed);
        const validation = factValidator.validate(parsed);
        const generated = aiWriter.generate(parsed, classification);

        const item = await queue.add({
          source_id: raw.source_id,
          raw_content_id: raw.id,
          category: classification.category,
          confidence_score: validation.confidence_score,
          headline: generated.headline,
          summary: generated.summary,
          article: generated.article,
          tags: generated.tags,
        });

        results.push({ raw_id: raw.id, item_id: item.id, status: 'processed' });
      } catch (e) {
        results.push({ raw_id: raw.id, status: 'error', error: e.message });
      }
    }

    res.json({ success: true, processed: results.length, results });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
