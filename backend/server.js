require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authRoutes = require('./routes/auth');
const app = express();
const port = process.env.PORT || 3001;

// Configure session management
app.use(session({
  secret: 'secret', // Replace with a real secret key
  resave: false,
  saveUninitialized: true,
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Passport session handling
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Configure Google OAuth 2.0 strategy for Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // In a production app, you would want to associate the Google account with a user record in your database.
    // For now, we'll just pass the profile along.
    return cb(null, profile);
  }
));

// Set up auth routes
app.use('/auth', authRoutes);

// Route to display user profile or redirect to login
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Logged in as: ${req.user.displayName}`);
  } else {
    res.redirect('/login');
  }
});

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
