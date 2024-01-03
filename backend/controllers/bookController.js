const path = require('path');
const Book = require('../models/book');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
 const { PDFDocument } = require('pdf-lib');

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
    // Read the PDF file from disk and extract metadata
    const pdfData = await pdfParse(fs.readFileSync(bookFile.path));
    const title = pdfData.info.Title || bookFile.originalname || 'Untitled';
    const author = pdfData.info.Author || 'Unknown';

    const newBook = new Book({
      title,
      author,
      filePath: bookFile.path, // Assuming 'book' is the field name for the uploaded file
      userId: req.user._id
    });
    const savedBook = await newBook.save();

    // Generate thumbnail using pdf-lib
    const pdfBytes = fs.readFileSync(savedBook.filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);
    const jpgImage = await page.getImage(0);
    if (jpgImage) {
      const jpgDataUri = jpgImage.toDataURL();
      // Save the image data URI as the thumbnail
      savedBook.coverImagePath = jpgDataUri;
      await savedBook.save();
      res.status(201).send(savedBook);
    } else {
      console.error('No image found on the first page of the PDF');
      res.status(500).send({ message: 'No image found on the first page of the PDF' });
    }
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
