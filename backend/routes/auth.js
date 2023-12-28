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
    // Successful authentication, respond with OK status.
    res.status(200).send('Mock login response');
  }
);

// Mock route for logging out and destroying the session
router.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    // The 'set-cookie' header should indicate that the session cookie has been cleared
    res.setHeader('set-cookie', 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.status(200).send('Logged out');
  });
});

module.exports = router;
