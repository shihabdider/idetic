const express = require('express');
const passport = require('passport');
const router = express.Router();

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
