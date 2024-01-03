const express = require('express');
const passport = require('passport');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Book = require('../models/book');

// Route for testing: Print all users in the database to the console
router.get('/db-contents/user', async (req, res) => {
  try {
    const users = await User.find({});
    console.log('Database contents:', users);
    res.send('Check server logs for database contents.');
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Error fetching database contents.');
  }
});

router.get('/db-contents/books', async (req, res) => {
  try {
    const users = await Book.find({});
    console.log('Database contents:', users);
    res.send('Check server logs for database contents.');
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Error fetching database contents.');
  }
});


// Route for testing: Print all sessions in the database to the console
router.get('/session-contents', async (req, res) => {
  try {
    const sessionCollection = mongoose.connection.collection('sessions');
    const sessions = await sessionCollection.find({}).toArray();
    console.log('Session contents:', sessions);
    res.send('Check server logs for session contents.');
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).send('Error fetching session contents.');
  }
});

module.exports = router;
