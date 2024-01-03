const request = require('supertest');
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const Book = require('../models/book');
const User = require('../models/user');
const app = require('../server');

const nock = require('nock');
const session = require('express-session');

// Mock express-session middleware to avoid creating actual sessions
app.use(session({
  secret: 'testsecret',
  resave: false,
  saveUninitialized: true
}));

describe('Backend Endpoints', function() {
  describe('Auth Endpoints', function() {
    it('GET /auth/google should redirect to Google', function(done) {
      request(app)
        .get('/auth/google')
        .expect(302) // Expect a redirection to Google's OAuth service
        .end(function(err, res) {
          expect(res.header.location).to.include('accounts.google.com');
          done(err);
        });
    });

    it('GET /auth/google/callback should handle callback', function(done) {
      // Mock the Google OAuth callback response
      nock('http://localhost:3001')
        .get('/auth/google/callback')
        .reply(200, 'Mock OAuth callback response');

      request(app)
        .get('/auth/google/callback')
        .expect(302) 
        .end(function(err, res) {
          expect(res.text).to.equal('');
          done(err);
        });
    });
  });

  it('GET /flashcards should return not implemented message', function(done) {
    request(app)
      .get('/flashcards')
      .end(function(err, res) {
        expect(res.text).to.equal('Flashcard browsing not implemented yet.');
        done(err);
      });
  });
});
