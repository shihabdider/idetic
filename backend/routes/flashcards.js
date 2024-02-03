const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');

router.get('/', flashcardController.listFlashcards);
router.get('/export/:bookId', flashcardController.exportFlashcards);
router.post('/', flashcardController.createFlashcard);
router.get('/:id', flashcardController.getFlashcard);
router.put('/:id', flashcardController.updateFlashcard);
router.delete('/:id', flashcardController.deleteFlashcard);
router.delete('/:bookId/all', flashcardController.deleteAllFlashcardsByBook);
router.post('/generate-with-gpt', flashcardController.generateFlashcardsWithGPT);
router.get('/book/:bookId', flashcardController.listFlashcardsByBook);

module.exports = router;
