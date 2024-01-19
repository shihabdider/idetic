# iDetic

A cloud-based book reader application with GPT-powered flashcard generation.
The app allows users to generate flashcards from highlighted text within books
and export them to Anki. The cards (currently) take the page of the highlight
as the context. This is an MVP with further improvements planned.

## Demo

[!(iDetic Demo)](https://github.com/shihabdider/idetic/blob/main/idetic_demo.mp4)

## Features

**Core Features Overview:**
1. **User Authentication:**
   - Google OAuth integration for secure login.
   
2. **Book Reader Mode:**
   - Book library browser with search functionality.
   - Options to upload and delete books.
   - Reading interface with highlights 
   - Flashcard creation from highlighted text using GPT-3.5

3. **Highlights/Flashcard Browser:**
   - Navigable list of all highlights within a book.
   - Option to generate flashcards directly from highlights.
   - Edit, delete and export flashcards

4. **Cloud-based Data Storage:**
   - Synchronization of books, highlights, and flashcards across devices.
   - Support for offline use with resynchronization upon reconnecting to the internet.
   - Can export flashcards to a text/csv file

## Requirements

- [Node.js](https://nodejs.org/en/) v14.15.4 or higher
- [npm](https://www.npmjs.com/) v6.14.10 or higher
- [MongoDB](https://www.mongodb.com/) v4.4.3 or higher
- openai API key
- Google OAuth credentials

## Installation
1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Create a `.env` file in the root directory of the project and add the following environment variables:
```
MONGO_URI=<your_mongodb_uri>
OPENAI_API_KEY=<your_openai_api_key>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```
4. Run the app (do this for both the server and client)
```bash
npm start
```
5. Navigate to `localhost:3000` in your browser
