require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/books');
const flashcardRoutes = require('./routes/flashcards');
const highlightRoutes = require('./routes/highlights');
const cors = require('cors');
const app = express();

// Enable CORS for the frontend on a different port
app.use(cors({
  origin: 'http://localhost:3000', // Allow the frontend to access the backend
  credentials: true, // Allow cookies to be sent with requests
}));
const port = process.env.PORT || 3001;
const MongoStore = require('connect-mongo');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Configure session management
app.use(session({
  secret: 'secret', // Replace with a real secret key
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) // Store session in MongoDB
}));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.use('/books', bookRoutes);
app.use('/flashcards', flashcardRoutes);
app.use('/highlights', highlightRoutes);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'uploads/books' directory
app.use('/uploads/books', express.static(path.join(__dirname, 'uploads', 'books')));

app.get('/flashcards', (req, res) => {
  // TODO: Implement flashcard browsing functionality
  res.send('Flashcard browsing not implemented yet.');
});

module.exports = app;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
