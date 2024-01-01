require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('./models/user');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const bookRoutes = require('./routes/books');
const app = express();
const port = process.env.PORT || 3001;
const MongoStore = require('connect-mongo');

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
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await User.findOne({ googleId: profile.id }).exec();
      if (!user) {
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value
        });
        await user.save();
      }
      cb(null, user);
    } catch (err) {
      cb(err);
    }
  }
));

app.get('/', (req, res) => {
  res.send('Welcome to iDetic!');
});

app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/books', bookRoutes);

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/profile');
  } else {
    // Render login page or redirect to Google OAuth
    // res.render('login'); // Uncomment this if you have a login page to render
    res.redirect('/auth/google'); // Redirect to Google OAuth if no login page
  }
});

app.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Logged in as: ${req.user.displayName}`);
  } else {
    res.redirect('/login');
  }
});

app.get('/flashcards', (req, res) => {
  // TODO: Implement flashcard browsing functionality
  res.send('Flashcard browsing not implemented yet.');
});

module.exports = app;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
