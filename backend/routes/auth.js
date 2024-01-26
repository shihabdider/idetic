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


// Route to verify if the user is authenticated
router.get('/verify', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).send({ message: 'User is authenticated' });
  } else {
    res.status(401).send({ message: 'User is not authenticated' });
  }
});

module.exports = router;
