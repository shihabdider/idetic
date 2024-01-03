import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon } from '@mui/icons-material';
import { Container, Grid, Paper, TextField, Button, Box, IconButton } from '@mui/material';
import { useForm } from 'react-hook-form';

function BookLibrary() {
  const [books, setBooks] = useState([]);
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('book', data.book[0]);

   axios.post('http://localhost:3001/books', formData, {
     withCredentials: true,
     headers: {
       'Content-Type': 'multipart/form-data',
       'Authorization': 'Bearer ' + localStorage.getItem('authToken')
      }
    })
    .then(response => {
      // Handle success
      console.log('Book uploaded successfully', response);
      setBooks([...books, response.data]);
    })
    .catch(error => {
      // Handle error
      console.error('Error uploading book:', error);
    });
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:3001/books');
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchBooks();
  }, []);

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register('book')}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            id="upload-book"
          />
          <label htmlFor="upload-book">
            <IconButton component="span">
              <Button variant="contained" component="span" sx={{ ml: 2 }}>
                Upload Book
              </Button>
            </IconButton>
          </label>
          <Button type="submit" variant="contained" sx={{ ml: 2 }}>
            Submit
          </Button>
        </form>
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {books.length > 0 ? books.map((book) => (
          <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <img src={book.thumbnailUrl} alt={book.title} style={{ width: '100%', height: 'auto' }} />
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
        )) : <p>No books available.</p>}
      </Grid>
    </Container>
  );

}

export default BookLibrary;
