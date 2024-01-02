const path = require('path');
const Book = require('../models/book');

exports.listBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id });
    res.json(books);
  } catch (error) {
    res.status(500).send(error);
  }
};
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // You need to create this directory or configure as needed
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

exports.createBook = [upload.single('book'), async (req, res) => {
  try {
    const bookFile = req.file;
    if (!bookFile) {
      return res.status(400).send({ message: 'No book file uploaded.' });
    }
    // Extract metadata from the file if available or set default values
    const title = bookFile.originalname || 'Untitled';
    const author = 'Unknown'; // Update this line to extract author if possible
    const bookFile = req.file;
    const newBook = new Book({
      title,
      author,
      filePath: bookFile.path, // Assuming 'book' is the field name for the uploaded file
      filePath: bookFile.path,
      userId: req.user._id
    });
    const savedBook = await newBook.save();
    res.status(201).send(savedBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).send({ message: 'Error creating book', error: error.message });
  }
}];

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
