const request = require('supertest');
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
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
  it('GET / should return welcome message', function(done) {
    request(app)
      .get('/')
      .end(function(err, res) {
        expect(res.text).to.equal('Welcome to iDetic!');
        done(err);
      });
  });

  it('GET /books should return not implemented message', function(done) {
    request(app)
      .get('/books')
      .end(function(err, res) {
        expect(res.text).to.equal('Book browsing not implemented yet.');
        done(err);
      });
  });

  it('POST /books should return not implemented message', function(done) {
    request(app)
      .post('/books')
      .end(function(err, res) {
        expect(res.text).to.equal('Book upload not implemented yet.');
        done(err);
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

  describe('Book Management Endpoints', function() {
    it('POST /books should upload a book', function(done) {
      const filePath = path.join(__dirname, 'data', 'testbook.pdf');
      fs.readFile(filePath, function(err, data) {
        if (err) throw err;
        request(app)
          .post('/books')
          .attach('book', data, 'testbook.pdf')
          .expect(201)
          .end(function(err, res) {
            expect(res.body).to.have.property('_id');
            expect(res.body.title).to.equal('Test Book');
            done(err);
          });
      });
    });

    it('GET /books should list all books', function(done) {
      request(app)
        .get('/books')
        .expect(200)
        .end(function(err, res) {
          expect(res.body).to.be.an('array');
          done(err);
        });
    });

    it('GET /books/:id should retrieve a specific book', function(done) {
      // This test will need a valid book ID to pass
      done();
    });

    it('PUT /books/:id should update a book\'s details', function(done) {
      // This test will need a valid book ID to pass
      done();
    });

    it('DELETE /books/:id should delete a book', function(done) {
      // This test will need a valid book ID to pass
      done();
    });
  });
});
