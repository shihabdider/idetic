import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import BookViewer from './components/BookViewer';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import BookLibrary from './components/BookLibrary';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<BookLibrary />} />
          <Route path="/books/:id" element={<BookViewer />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
