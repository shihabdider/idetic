const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  text: String,
  location: String,
  bookId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId
});

const Highlight = mongoose.model('Highlight', highlightSchema);

module.exports = Highlight;
