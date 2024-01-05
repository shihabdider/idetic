import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { Paper, CircularProgress, Button } from '@mui/material';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function BookViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  useLayoutEffect(() => {
    function calculateScale() {
      const scale = Math.min(10, window.innerWidth / 900); // Adjust scale based on screen width
      setScale(scale > 0.5 ? scale : 0.5); // Ensure a minimum scale of 0.5
    }

    window.addEventListener('resize', calculateScale);
    calculateScale();
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

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
    <Paper elevation={3} style={{ position: 'relative' }}>
      <Button onClick={() => navigate('/')} style={{ margin: '10px', position: 'sticky', top: '0' }}>Back to Library</Button>
      <Document
        file={book ? `http://localhost:3001/${book.filePath}` : null}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<CircularProgress />}
      >

        {Array.from( new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} style={{ display: 'flex', justifyContent: 'center' }}>
              <Page key={`page_${index + 1}`} pageNumber={index + 1} scale={scale} />
            </div>
          ),
        )}
      </Document>
    </Paper>
  );
}

export default BookViewer;
