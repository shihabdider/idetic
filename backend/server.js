require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('./models/user');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
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
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/books', bookRoutes);
app.use('/flashcards', flashcardRoutes);
app.use('/highlights', highlightRoutes);

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
