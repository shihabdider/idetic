const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Welcome to iDetic!');
});

// Placeholder routes for future implementation
app.get('/books', (req, res) => {
  // TODO: Implement book browsing functionality
  res.send('Book browsing not implemented yet.');
});

app.post('/books', (req, res) => {
  // TODO: Implement book upload functionality
  res.send('Book upload not implemented yet.');
});

app.get('/flashcards', (req, res) => {
  // TODO: Implement flashcard browsing functionality
  res.send('Flashcard browsing not implemented yet.');
});

module.exports = app;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
