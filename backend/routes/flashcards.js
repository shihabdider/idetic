const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ message: 'User is not authenticated' });
}

router.get('/', isAuthenticated, flashcardController.listFlashcards);
router.get('/export/:bookId', isAuthenticated, flashcardController.exportFlashcards);
router.post('/', isAuthenticated, flashcardController.createFlashcard);
router.get('/:id', isAuthenticated, flashcardController.getFlashcard);
router.put('/:id', isAuthenticated, flashcardController.updateFlashcard);
router.delete('/:id', isAuthenticated, flashcardController.deleteFlashcard);
router.delete('/:bookId/all', isAuthenticated, flashcardController.deleteAllFlashcardsByBook);
router.post('/generate-with-gpt', isAuthenticated, flashcardController.generateFlashcardsWithGPT);
router.get('/book/:bookId', isAuthenticated, flashcardController.listFlashcardsByBook);

module.exports = router;
