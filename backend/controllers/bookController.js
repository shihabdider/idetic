const path = require('path');
const Book = require('../models/book');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const PDFImage = require('pdf-image').PDFImage;

exports.listBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id });
    res.json(books);
  } catch (error) {
    res.status(500).send(error);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/books/') // You need to create this directory or configure as needed
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
    // Read the PDF file and extract metadata
    const pdfData = await pdfParse(bookFile.buffer);
    const title = pdfData.info.Title || bookFile.originalname || 'Untitled';
    const author = pdfData.info.Author || 'Unknown';

    const newBook = new Book({
      title,
      author,
      filePath: bookFile.path, // Assuming 'book' is the field name for the uploaded file
      userId: req.user._id
    });
    const savedBook = await newBook.save();

    // Generate thumbnail
    const pdfImage = new PDFImage(path.join('uploads/books/', savedBook.filePath));
    pdfImage.convertPage(0).then(async (imagePath) => {
      savedBook.coverImagePath = path.join('uploads/thumbnails/', imagePath);
      await savedBook.save();
      res.status(201).send(savedBook);
    }, (err) => {
      console.error('Error generating thumbnail:', err);
      res.status(500).send({ message: 'Error generating thumbnail', error: err.message });
    });
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
