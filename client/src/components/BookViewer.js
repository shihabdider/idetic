import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { Paper, CircularProgress, Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import HighlightIcon from '@mui/icons-material/Highlight';
import Popover from '@mui/material/Popover';
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [highlightText, setHighlightText] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverOpen = Boolean(anchorEl);
  const popoverId = popoverOpen ? 'highlight-popover' : undefined;

  const handleTextSelection = (event) => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setHighlightText(selection.toString());
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopoverPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      });
      setAnchorEl(document.body); // Anchor to body and use calculated position
      let parentNode = selection.anchorNode.parentNode;
      while (parentNode && !parentNode.dataset.pageNumber) {
        parentNode = parentNode.parentNode;
      }
      const pageNumber = parentNode ? parentNode.dataset.pageNumber : null;
      setSelectedPage(pageNumber);
    } else {
      setAnchorEl(null);
    }
  };

  const handleCreateHighlight = async () => {
    try {
      if (!selectedPage) {
        throw new Error('Page number is not available for the highlight.');
      }
      const response = await axios.post(
        `http://localhost:3001/highlights`,
        {
          text: highlightText,
          location: `Page ${selectedPage}`, // Use the page number as the location
          bookId: id,
        },
        { withCredentials: true }
      );
      // Handle the response, e.g., by adding the new highlight to state
    } catch (error) {
      console.error('Error creating highlight:', error);
    }
    setAnchorEl(null);
  };

  // ... rest of the component
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Existing useLayoutEffect and useEffect hooks...

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
      <Button onClick={() => navigate('/')} style={{ margin: '16px', position: 'sticky', top: '8px' }}>Back to Library</Button>
      <Popover
        id={popoverId}
        open={popoverOpen}
        anchorEl={anchorEl}
        style={{
          position: 'absolute',
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`
        }}
        onClose={() => setAnchorEl(null)}
      >
        <IconButton onClick={handleCreateHighlight} size="large">
          <HighlightIcon />
        </IconButton>
      </Popover>
      <Document
        file={book ? `http://localhost:3001/${book.filePath}` : null}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<CircularProgress />}
        onMouseUp={handleTextSelection}
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
