import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon } from '@mui/icons-material';
import { Container, Grid, Paper, TextField, Button, Box, IconButton, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import Dropzone from 'react-dropzone';

function BookLibrary() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const logoPath = '/idetic_logo.png';

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('book', file);
    setIsUploading(true);

    axios.post('http://localhost:3001/books', formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
      },
    })
    .then(response => {
      // Handle success
      console.log('Book uploaded successfully', response);
      setBooks([...books, response.data]);
      setIsUploading(false);
    })
    .catch(error => {
      // Handle error
      console.error('Error uploading book:', error);
      setIsUploading(false);
    });
  };

  const deleteBook = async (bookId) => {
    try {
      await axios.delete(`http://localhost:3001/books/${bookId}`, { withCredentials: true });
      setBooks(books.filter(book => book._id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 1}}>
        <img src={logoPath} alt="Idetic Logo" style={{ maxHeight: '180px', marginRight: 'auto' }} />
        <TextField
          variant="outlined"
          placeholder="Search for books..."
          onChange={handleSearchChange}
          InputProps={{
            endAdornment: <SearchIcon />,
          }}
          style={{ flexGrow: 1, alignSelf: 'center' }}
        />
        <Dropzone accept={{"application/pdf": [".pdf"]}} onDrop={onDrop}>
          {({getRootProps, getInputProps}) => (
            <section style={{ display: 'flex', alignItems: 'center' }}>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                {isUploading ? (
                  <CircularProgress />
                ) : (
                  <Button variant="contained" style={{ height: '48px' }}>Upload</Button>
                )}
              </div>
            </section>
          )}
        </Dropzone>
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {filteredBooks.length > 0 ? filteredBooks.map((book) => (
          <Grid item key={book._id} xs={12} sm={6} md={4} lg={3}>
            <Paper sx={{ p: 2, height: '400px', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Box sx={{ width: '100%', height: '80%', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} onClick={() => navigate(`/books/view/${book._id}`)}>
                <img src={`http://localhost:3001/${book.coverImagePath}`} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
              <Box sx={{ mt: 1 }}>
                <IconButton color="error" onClick={() => deleteBook(book._id)} style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        )) : <p>No books available.</p>}
      </Grid>
    </Container>
  );

}

export default BookLibrary;
