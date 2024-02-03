const express = require('express');
const router = express.Router();
const highlightController = require('../controllers/highlightController');

router.get('/', highlightController.listHighlights);
router.get('/export', highlightController.exportHighlights);
router.post('/', highlightController.createHighlight);
router.get('/:id', highlightController.getHighlight);
router.put('/:id', highlightController.updateHighlight);
router.delete('/:id', highlightController.deleteHighlight);
router.post('/:id/query-gpt', highlightController.queryGPT);

module.exports = router;
