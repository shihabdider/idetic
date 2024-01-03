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
   - Flashcard creation from highlighted text using GPT-4 API

3. **Highlights Browser:**
   - Searchable and navigable list of all highlights within a book.
   - Option to generate flashcards directly from highlights.
   - Should be accessible from within the book reader

4. **Cloud-based Data Storage:**
   - Synchronization of books, highlights, and flashcards across devices.
   - Support for offline use with resynchronization upon reconnecting to the internet.
   - Can export highlights and flashcards to a text/csv file

## User Experience Requirements

**App Entry Point - Book Library Browser:**
- Clean, intuitive interface displaying available books with high-quality thumbnails.
- Quick access to search, upload, and delete actions.
- Upon tapping a book, transition to book reader mode.

**Book Reader Interface:**
- Minimalist reading interface with easy highlight and flashcard creation options.
- Options for users to adjust text size, font, and background for comfortable reading.
- Tooltips or instructional overlays for first-time users when they use the highlight or flashcard function.

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

## Development Approach

### Backend Development Steps:

 ### Directory Structure:

 ```
 /backend
 ├── controllers     # Business logic for handling API requests
 ├── models          # Database models
 ├── routes          # Express route definitions
 │   └── auth.js     # Authentication routes
 ├── tests           # Test files for the backend
 │   └── test_endpoints.spec.js
 ├── utils           # Utility functions and middleware
 ├── server.js       # Entry point for the backend server
 └── package.json    # NPM package file

 /frontend
 ├── public          # Static files
 ├── src             # React source files
 │   ├── components  # React components
 │   ├── services    # Services for API communication
 │   ├── App.js      # Main React application file
 │   └── index.js    # Entry point for the React app
 ├── package.json    # NPM package file for the frontend
 └── README.md       # README for the frontend
 ```


1. [x] **Set up the development environment:**
   - Install Node.js and npm.
   - Initialize a new Node.js project with `npm init`.
   - Set up version control with Git.

2. [x] **Create the project structure:**
   - Organize the project into folders for routes, controllers, models, and utilities.

3. [x] **Set up Express.js:**
   - Install Express.js with `npm install express`.
   - Create a basic server with route placeholders.

4. [x] **Implement User Authentication:**
   - Integrate Google OAuth 2.0 using Passport.js.
   - Set up user sessions and authentication middleware.
   - Set up a MongoDB database for storing user and session data.

5. [x] **Design the Database Schema:**
   - Install MongoDB and a driver like Mongoose.
   - Define schemas for books, highlights, and flashcards.

6. **Develop RESTful APIs:**
   - Create routes and controllers for book management (upload, delete, browse).
   - Add endpoints for highlights browsing and flashcard creation.
   - Add endpoints for flashcard and highlight export.

7. **Integrate OpenAI's GPT API:**
   - Set up the OpenAI API call for generating flashcard content.

9. **Set up Cloud-based Data Storage:**
   - Configure MongoDB for cloud storage.
   - Implement data synchronization logic.

10. **Security Measures:**
    - Ensure all routes are protected with authentication checks.
    - Set up HTTPS for secure data transmission.

11. **Testing:**
    - Write unit tests for each API endpoint.
    - Perform integration testing.

12. **Documentation:**
    - Document the API endpoints with tools like Swagger.

13. **Prepare for Deployment:**
    - Set up environment variables for production.
    - Create a deployment script.

### Frontend Development Steps:

1. **Set up the development environment:**
   - Install React and React Native for web and mobile development.
   - Set up a linter and formatter like ESLint and Prettier.

2. **Create the project structure:**
   - Organize components, screens, services, and utilities.

3. **Develop Core Features:**
   - Implement user authentication flow with Google OAuth.
   - Create the book library browser interface.
   - Build the book reader interface with highlight and note-taking capabilities.
   - Design the highlights browser.

4. **UI/UX Design:**
   - Apply Material Design principles using Material-UI.
   - Ensure responsive design for mobile and web.

5. **Local Storage and Offline Capabilities:**
   - Implement local storage for offline access.
   - Handle data resynchronization when reconnecting to the internet.
   - Handle export of highlights and flashcards to a text/csv file.

6. **Testing:**
   - Write unit tests for components.
   - Perform end-to-end testing.

7. **Documentation:**
   - Document the components and their usage.

8. **Prepare for Deployment:**
   - Build the application for production.
   - Test the deployment on a staging environment.

### Integration Steps:

1. **Connect Frontend with Backend:**
   - Set up API services in the frontend to communicate with the backend.
   - Ensure proper error handling and data validation.

2. **End-to-End Testing:**
   - Test the complete flow from frontend to backend.

3. **User Acceptance Testing:**
   - Conduct user acceptance testing to gather feedback.

4. **Finalize Deployment:**
   - Deploy the backend to a cloud service.
   - Deploy the web frontend and publish the mobile app.

5. **Post-Deployment:**
   - Monitor the application for issues.
   - Set up a process for continuous integration and deployment (CI/CD).

---
