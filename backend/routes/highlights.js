const express = require('express');
const router = express.Router();
const highlightController = require('../controllers/highlightController');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ message: 'User is not authenticated' });
}

router.get('/', isAuthenticated, highlightController.listHighlights);
router.post('/', isAuthenticated, highlightController.createHighlight);
router.get('/:id', isAuthenticated, highlightController.getHighlight);
router.put('/:id', isAuthenticated, highlightController.updateHighlight);
router.delete('/:id', isAuthenticated, highlightController.deleteHighlight);

module.exports = router;
