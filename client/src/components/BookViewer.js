import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function BookViewer() {
  const { id } = useParams();
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfDocument, setPdfDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPdfDocument = async () => {
      try {
        // Fetch the book details to get the filePath
        const response = await axios.get(`http://localhost:3001/books/${id}`, { withCredentials: true });
        const pdfTitle = response.data.title;
        setPdfTitle(pdfTitle);
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

  const goBackToLibrary = () => {
    navigate('/');
  };

  const addHighlight = (highlight) => {
    axios.post(`http://localhost:3001/highlights`, {
      text: highlight.content.text,
      location: JSON.stringify(highlight.position),
      bookId: id
    }, { withCredentials: true })
    .then(response => {
      setHighlights([...highlights, response.data]);
    })
    .catch(error => {
      console.error('Error saving highlight:', error);
    });
  };

  const updateHighlight = (highlightId, position, content) => {
    // Implement the logic to update the highlight on the server
    console.log('Updating highlight', highlightId, position, content);
  };

  const onSelectionFinished = (
    highlightedArea,
    highlight,
    submitHighlight
  ) => {
    submitHighlight(highlight);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <AppBar position="fixed" sx={{
             background: 'white',
             color: 'black',
             boxShadow: 'none',
             marginRight: '16px',
             width: `calc(100% - 16px)`,
             }}
          >
          <Toolbar>
            <IconButton edge="start" color="default" aria-label="back" onClick={goBackToLibrary}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h7" noWrap style={{ color: 'black' }}>
              { pdfTitle }
            </Typography>
          </Toolbar>
        </AppBar>
      {pdfDocument && highlights && (
        <PdfLoader url={pdfDocument} beforeLoad={<div>Loading...</div>}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onHighlight={addHighlight}
              onUpdateHighlight={updateHighlight}
              onSelectionFinished={onSelectionFinished}
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
