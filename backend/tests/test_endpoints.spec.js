const request = require('supertest');
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const Book = require('../models/book');
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

  it('GET /flashcards should return not implemented message', function(done) {
    request(app)
      .get('/flashcards')
      .end(function(err, res) {
        expect(res.text).to.equal('Flashcard browsing not implemented yet.');
        done(err);
      });
  });
});
