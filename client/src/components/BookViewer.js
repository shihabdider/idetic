import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import { Paper, CircularProgress } from '@mui/material';

// pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function BookViewer() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1); // We will not use this state if we implement infinite scrolling

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/books/${id}`, { withCredentials: true });
        setBook(response.data);
      } catch (error) {
        console.error('Error fetching book:', error);
      }
    };

    fetchBook();
  }, [id]);

  return (
    <Paper elevation={3} style={{ overflow: 'auto', position: 'relative' }}>
      <Document
        file={book ? `http://localhost:3001/${book.filePath}` : null}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<CircularProgress />}
      >
        {Array.from(
          new Array(numPages),
          (el, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
          ),
        )}
      </Document>
    </Paper>
  );
}

export default BookViewer;
