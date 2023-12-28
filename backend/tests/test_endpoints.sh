#!/bin/bash

# Simple script to test the backend endpoints

echo "Testing GET /"
curl -s http://localhost:3000/ | grep 'Welcome to iDetic!' && echo "GET / passed" || echo "GET / failed"

echo "Testing GET /books"
curl -s http://localhost:3000/books | grep 'Book browsing not implemented yet.' && echo "GET /books passed" || echo "GET /books failed"

echo "Testing POST /books"
curl -s -X POST http://localhost:3000/books | grep 'Book upload not implemented yet.' && echo "POST /books passed" || echo "POST /books failed"

echo "Testing GET /flashcards"
curl -s http://localhost:3000/flashcards | grep 'Flashcard browsing not implemented yet.' && echo "GET /flashcards passed" || echo "GET /flashcards failed"

# Note: This script assumes that the server is running on localhost:3000
