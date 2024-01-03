import React from 'react';
import { Container, Grid, Paper, TextField, Button, Box } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

function BookLibrary() {
  // Placeholder data for books. Replace with state and API calls.
  const books = [
    { id: 1, title: 'Book One', thumbnail: '/path/to/thumbnail1.jpg' },
    { id: 2, title: 'Book Two', thumbnail: '/path/to/thumbnail2.jpg' },
    // Add more books here
  ];

  return (
    <Container component="main">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <TextField
          variant="outlined"
          placeholder="Search for books..."
          InputProps={{
            endAdornment: <SearchIcon />,
          }}
        />
        <Button variant="contained" sx={{ ml: 2 }}>
          Upload Book
        </Button>
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {books.map((book) => (
          <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <img src={book.thumbnail} alt={book.title} style={{ width: '100%', height: 'auto' }} />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" color="primary">
                  View
                </Button>
                <Button variant="outlined" color="secondary">
                  Delete
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default BookLibrary;
