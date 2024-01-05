import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon } from '@mui/icons-material';
import { Container, Grid, Paper, TextField, Button, Box, IconButton, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Dropzone from 'react-dropzone';

function BookLibrary() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
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
        {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} />}
        <Dropzone onDrop={acceptedFiles => {
          const file = acceptedFiles[0];
          const formData = new FormData();
          formData.append('book', file);

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
        }}>
          {({getRootProps, getInputProps}) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button variant="contained">Upload</Button>
              </div>
            </section>
          )}
        </Dropzone>
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
