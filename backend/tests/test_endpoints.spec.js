const request = require('supertest');
const expect = require('chai').expect;
const app = require('../server');
const app = require('../server');

describe('Backend Endpoints', function() {
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
});
