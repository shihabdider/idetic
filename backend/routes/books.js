const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ message: 'User is not authenticated' });
}

// Routes for book management
router.get('/', bookController.listBooks);
router.post('/', isAuthenticated, bookController.createBook);
router.get('/:id', bookController.getBook);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
