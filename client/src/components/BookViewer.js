import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { Paper, CircularProgress, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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

  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    const fetchBookAndHighlights = async () => {
      try {
        const bookResponse = await axios.get(`http://localhost:3001/books/${id}`, { withCredentials: true });
        setBook(bookResponse.data);

        const highlightsResponse = await axios.get(`http://localhost:3001/highlights/book/${id}`, { withCredentials: true });
        setHighlights(highlightsResponse.data);
      } catch (error) {
        console.error('Error fetching book or highlights:', error);
      }
    };

    fetchBookAndHighlights();
  }, [id]);

  const addHighlight = async () => {
    // Implement logic to add highlight
    // This will depend on the PDF viewer library you are using
  };

  return (
    <Paper elevation={3} style={{ position: 'relative' }}>
      <Button onClick={() => navigate('/')} style={{ margin: '16px', position: 'sticky', top: '8px' }}>Back to Library</Button>
      <Button onClick={addHighlight} style={{ margin: '16px', position: 'sticky', top: '8px' }}>Add Highlight</Button>
      <Document
        file={book ? `http://localhost:3001/${book.filePath}` : null}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<CircularProgress />}
      >
        {Array.from( new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} style={{ display: 'flex', justifyContent: 'center' }}>
              <Page key={`page_${index + 1}`} pageNumber={index + 1} scale={scale} />
              {/* Implement logic to display highlights here */}
              {/* This will depend on the PDF viewer library you are using */}
            </div>
          ),
        )}

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
