const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route to render login page or initiate login process
router.get('/login', (req, res) => {
  // If user is already logged in, redirect to profile
  if (req.isAuthenticated()) {
    res.redirect('/profile');
  } else {
    // Render login page or redirect to Google OAuth
    // res.render('login'); // Uncomment this if you have a login page to render
    res.redirect('/auth/google'); // Redirect to Google OAuth if no login page
  }
});

// Redirect to Google for authentication
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google will redirect to this route after authentication
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to profile.
    res.redirect('/profile');
  }
);

// Mock route for logging out and destroying the session
router.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    // Redirect to home page after logout
    res.redirect('/');
  });
});

module.exports = router;
