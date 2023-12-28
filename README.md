# Design Document for iDetic

## Project Overview

**Application Name:** iDetic

**Description:** A cloud-based book reader application that includes a built-in spaced repetition flashcard system. The app allows users to generate flashcards from highlighted text within books, utilize OpenAI's GPT API for content enhancement, and review these cards using the Anki-based SM2 algorithm. The app will be accessible via web and mobile platforms, with offline capabilities on mobile and cloud sync capabilities.

**Goals:**
- Streamline the process of creating flashcards from reading material.
- Provide a seamless reading and study experience.
- Enable cloud synchronization to maintain progress across devices.

## Features and Functionality

**Core Features Overview:**
1. **User Authentication:**
   - Google OAuth integration for secure login.
   
2. **Book Reader Mode:**
   - Book library browser with search functionality.
   - Options to upload and delete books.
   - Reading interface with highlight and note-taking capabilities.
   - Flashcard creation from highlighted text.

3. **Flashcard Manager:**
   - Browse, search, add, edit and delete flashcards.
   - Organize flashcards by book source and other categories.
   - Card reviewing system with daily scheduled reviews using the SM2 algorithm.
   - Linkage to the originating book and highlight.
   - Integration with OpenAI's GPT for auto-generating card content from highlight text.

4. **Highlights Browser:**
   - Searchable and navigable list of all highlights within a book.
   - Option to generate flashcards directly from highlights.
   - Should be accessible from within the book reader

5. **Cloud-based Data Storage:**
   - Synchronization of books, highlights, and flashcards across devices.
   - Support for offline use with resynchronization upon reconnecting to the internet.

## User Experience Requirements

**App Entry Point - Book Library Browser:**
- Clean, intuitive interface displaying available books with high-quality thumbnails.
- Quick access to search, upload, and delete actions.
- Upon tapping a book, transition to book reader mode.

**Book Reader Interface:**
- Minimalist reading interface with easy highlight and flashcard creation options.
- Options for users to adjust text size, font, and background for comfortable reading.
- Tooltips or instructional overlays for first-time users when they use the highlight or flashcard function.

**Flashcard Browser & Review System:**
- Simplified interface allowing users to review their scheduled flashcards.
- Flashcard browsing with filtering and sorting options.
- Easy navigation back to the origin of the flashcard content (specific book and highlight).

**Technical Specifications**

- **Front-End (Mobile & Web):** Utilize React Native for cross-platform mobile app development, and React for the web version to keep the user experience consistent across platforms.
- **Back-End Server:** Implement Node.js with Express.js framework for building RESTful APIs.
- **Database:** Use MongoDB for document storage, which is well-suited for storing books and flashcards with varied schemas.
- **Localhost for Initial Development:** Prepare the application to be run on localhost, with environment setup for easy cloud deployment later.
- **Development Environment Setup:** Provide a README with instructions on setting up the development environment for future developers, including how to run the app on localhost.

## Security Requirements

- **User Authentication:** Implement Google OAuth 2.0 for user authentication to ensure secure login and storage of user data.
- **Data Security:** Ensure secure transmission of data with HTTPS and apply standard security best practices.

## Additional Notes

- **Design Aesthetics:** Apply Material Design principles for a modern, responsive interface, using Material-UI library where applicable.
- **Product Scalability:** Architect the system with scalability in mind to handle increased loads and future feature expansions.
- **API Utilization:** Manage quota and efficient usage of OpenAI's GPT API to prevent excess call costs.

---
