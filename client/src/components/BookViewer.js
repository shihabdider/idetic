import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';

function BookViewer() {
  const { id } = useParams();
  const [pdfDocument, setPdfDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    const fetchPdfDocument = async () => {
      try {
        // Fetch the book details to get the filePath
        const response = await axios.get(`http://localhost:3001/books/${id}`, { withCredentials: true });
        const pdfPath = response.data.filePath;
        const fullPdfUrl = `http://localhost:3001/${pdfPath}`;
        setPdfDocument(fullPdfUrl);
      } catch (error) {
        console.error('Error fetching PDF document:', error);
      }
    };

    const fetchHighlights = async () => {
      // Replace with the actual API call to fetch highlights for the document
      const response = await axios.get(`http://localhost:3001/highlights?bookId=${id}`, { withCredentials: true });
      setHighlights(response.data);
    };

    fetchPdfDocument();
    fetchHighlights();
  }, [id]);

  // ... rest of the component
  const addHighlight = (highlight) => {
    // Implement the logic to save the highlight to the server
    console.log('Saving highlight', highlight);
  };

  const updateHighlight = (highlightId, position, content) => {
    // Implement the logic to update the highlight on the server
    console.log('Updating highlight', highlightId, position, content);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {pdfDocument && highlights && (
        <PdfLoader url={pdfDocument} beforeLoad={<div>Loading...</div>}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onHighlight={addHighlight}
              onUpdateHighlight={updateHighlight}
              highlights={highlights}
              Tip={Tip}
              Highlight={Highlight}
              Popup={Popup}
              AreaHighlight={AreaHighlight}
            />
          )}
        </PdfLoader>
      )}
    </div>
  );
}

export default BookViewer;
