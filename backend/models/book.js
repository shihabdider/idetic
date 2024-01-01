const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  isbn: String,
  filePath: String,
  coverImagePath: String,
  userId: mongoose.Schema.Types.ObjectId
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
