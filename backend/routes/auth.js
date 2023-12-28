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
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

module.exports = router;
const express = require('express');
const router = express.Router();

// Mock user database
const users = {
  'user1': { id: 'user1', name: 'Test User', email: 'test@example.com' }
};

// Mock authentication function
function authenticate(email, password, done) {
  const user = users['user1']; // This should be replaced with actual authentication logic
  if (user && email === user.email) {
    return done(null, user);
  } else {
    return done(null, false, { message: 'Incorrect credentials.' });
  }
}

// Login route
router.post('/login', (req, res, next) => {
  authenticate(req.body.email, req.body.password, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json(info);
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({ message: 'Logged in successfully' });
    });
  });
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
