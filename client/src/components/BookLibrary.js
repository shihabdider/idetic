import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon } from '@mui/icons-material';
import { Container, Grid, Paper, TextField, Button, Box, IconButton } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

function BookLibrary() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
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
    const files = data.book;
    const totalFiles = files.length;
    let uploadedFiles = 0;

    files.forEach((file) => {
      const formData = new FormData();
      formData.append('book', file);

      axios.post('http://localhost:3001/books', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        onUploadProgress: (progressEvent) => {
          let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prevState => ({ ...prevState, [file.name]: percentCompleted }));
        }
      })
      .then(response => {
        // Handle success
        console.log('Book uploaded successfully', response);
        uploadedFiles++;
        if (uploadedFiles === totalFiles) {
          setUploadProgress({});
        }
        setBooks(prevBooks => [...prevBooks, response.data]);
      })
      .catch(error => {
        // Handle error
        console.error('Error uploading book:', error);
      });
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register('book')}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            id="upload-book"
            multiple
          />
          <label htmlFor="upload-book">
            <IconButton component="span">
              <Button variant="contained" component="span" sx={{ ml: 2 }}>
                Upload Book
              </Button>
            </IconButton>
          </label>
          <Button type="submit" variant="contained" sx={{ ml: 2 }} disabled={Object.keys(uploadProgress).length > 0}>
            Submit
          </Button>
          {Object.keys(uploadProgress).map((fileName) => (
            <Box key={fileName} sx={{ mt: 2 }}>
              <Typography variant="body2">{fileName}</Typography>
              <LinearProgress variant="determinate" value={uploadProgress[fileName]} />
            </Box>
          ))}
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
