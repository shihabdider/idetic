import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon } from '@mui/icons-material';
import { Container, Grid, Paper, TextField, Button, Box, IconButton } from '@mui/material';
import { Container, Grid, Paper, TextField, Button, Box, IconButton, LinearProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function BookLibrary() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const deleteBook = async (bookId) => {
    try {
      await axios.delete(`http://localhost:3001/books/${bookId}`, { withCredentials: true });
      setBooks(books.filter(book => book._id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('book', data.book[0]);
    setIsUploading(true);

   axios.post('http://localhost:3001/books', formData, {
     withCredentials: true,
     headers: {
       'Content-Type': 'multipart/form-data',
       'Authorization': 'Bearer ' + localStorage.getItem('authToken')
     },
     onUploadProgress: (progressEvent) => {
       const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
       setUploadProgress(percentCompleted);
     }
      }
    })
    .then(response => {
      // Handle success
      console.log('Book uploaded successfully', response);
      setBooks([...books, response.data]);
      setIsUploading(false);
      setUploadProgress(0);
    })
    .catch(error => {
      // Handle error
      console.error('Error uploading book:', error);
      setIsUploading(false);
      setUploadProgress(0);
    });
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:3001/books', { withCredentials: true });
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchBooks();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm)
  );

  return (
    <Container component="main">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <TextField
          variant="outlined"
          placeholder="Search for books..."
          onChange={handleSearchChange}
          InputProps={{
            endAdornment: <SearchIcon />,
          }}
        />
        {isUploading && <LinearProgress variant="determinate" value={uploadProgress} />}
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
        {filteredBooks.length > 0 ? filteredBooks.map((book) => (
          <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <img src={`http://localhost:3001/${book.coverImagePath}`} alt={book.title} style={{ width: '100%', height: 'auto' }} />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" color="primary" onClick={() => navigate(`/books/view/${book._id}`)}>
                  View
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => deleteBook(book._id)}>
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
