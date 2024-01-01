const Book = require('../models/book');

exports.listBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id });
    res.json(books);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.createBook = async (req, res) => {
  try {
    const newBook = new Book({ ...req.body, userId: req.user._id });
    const savedBook = await newBook.save();
    res.status(201).send(savedBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).send({ message: 'Error creating book', error: error.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).send('Book not found');
    }
    res.json(book);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
};
