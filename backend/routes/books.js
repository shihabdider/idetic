const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Routes for book management
router.get('/', bookController.listBooks);
router.post('/', bookController.createBook);
router.get('/:id', bookController.getBook);
router.put('/:id', bookController.updateBook);
router.patch('/:id/last-viewed-page-number', bookController.updateLastViewedPageNumber);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
