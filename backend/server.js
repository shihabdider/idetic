require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
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
      const User = require('./models/user');
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

app.use('/auth', authRoutes);

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

// Route for testing: Print all users in the database to the console
app.get('/test/db-contents', async (req, res) => {
  try {
    const users = await User.find({});
    console.log('Database contents:', users);
    res.send('Check server logs for database contents.');
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Error fetching database contents.');
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to iDetic!');
});

// Route for testing: Print all sessions in the database to the console
app.get('/test/session-contents', async (req, res) => {
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
