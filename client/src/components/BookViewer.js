import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Paper, CircularProgress } from '@mui/material';

// pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function BookViewer({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1); // We will not use this state if we implement infinite scrolling

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <Paper elevation={3} style={{ overflow: 'auto', position: 'relative' }}>
      <Document
        file={file}
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
