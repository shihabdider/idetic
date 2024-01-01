const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  frontText: String,
  backText: String,
  highlightId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

module.exports = Flashcard;
