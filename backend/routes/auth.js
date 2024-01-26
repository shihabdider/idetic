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
    // Successful authentication, redirect to the frontend profile page.
    res.redirect('http://localhost:3000/');
  }
);


module.exports = router;
