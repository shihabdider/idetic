import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Define your other routes here */}
          {/* Define your routes here */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
