import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import { AppBar, Toolbar, Typography, IconButton, Popover, Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function BookViewer() {
  const { id } = useParams();
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfDocument, setPdfDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [highlightToDelete, setHighlightToDelete] = useState(null);
  const navigate = useNavigate();
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

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
    console.log('Saving highlight', highlight);
    axios.post(`http://localhost:3001/highlights`, {
      content: {
        text: highlight.content.text,
        image: highlight.content.image // Include the image content if it exists
      },
      position: highlight.position,
      comment: highlight.comment, // Don't forget to include the comment
      bookId: id // Assuming 'id' is the ID of the book where the highlight is made
    }, { withCredentials: true })
    .then(response => {
      setHighlights([...highlights, response.data]);
      console.log('Highlights:', highlights); 
    })
    .catch(error => {
      console.error('Error saving highlight:', error);
    });
  };

  const updateHighlight = (highlight) => {
    console.log('Updating highlight', highlight)
    axios.put(`http://localhost:3001/highlights/${highlight._id}`, {
      content: {
        text: content?.text,
        image: content?.image
      },
      position: position,
    }, { withCredentials: true })
    .then(response => {
      const index = highlights.findIndex(h => h.id === highlight._id);
      if (index !== -1) {
        let newHighlights = [...highlights];
        newHighlights[index] = response.data;
        setHighlights(newHighlights);
      }
    })
    .catch(error => {
      console.error('Error updating highlight:', error);
    });
  };

  const deleteHighlight = (highlightId) => {
    axios.delete(`http://localhost:3001/highlights/${highlightId}`, { withCredentials: true })
      .then(() => {
        setHighlights(highlights.filter(h => h._id !== highlightId));
        setHighlightToDelete(null);
      })
      .catch(error => {
        console.error('Error deleting highlight:', error);
      });
  };

  const renderDeletePopover = () => (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handlePopoverClose}
      anchorPosition={{ top: popoverPosition.top, left: popoverPosition.left }}
      anchorReference="anchorPosition"
    >
      <Button
        startIcon={<DeleteOutlineIcon />}
        onClick={() => {deleteHighlight(highlightToDelete._id); handlePopoverClose()}}
        color="error"
      >
      </Button>
    </Popover>
  );

  const handlePopoverOpen = (highlight) => {
    const { boundingRect } = highlight.position;
    const highlightElement = document.querySelector(`[data-highlight-id="${highlight._id}"]`);
    if (highlightElement) {
      const rect = highlightElement.getBoundingClientRect();
      const popoverX = rect.left + rect.width / 2;
      const popoverY = rect.top;
      setPopoverPosition({ top: popoverY, left: popoverX });
    }
    setHighlightToDelete(highlight);
    console.log(popoverPosition);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setHighlightToDelete(null);
  };

  const onSelectionFinished = (
    position,
    content
  ) => {
    const highlight = { content, position };
    addHighlight(highlight);
  };

  const highlightTransform = (highlight, index, setTip, hideTip, viewportToScaled, screenshot, isScrolledTo) => {
    const isTextHighlight = !Boolean(highlight.content.image);
    const component = isTextHighlight ? (
      <Highlight
        isScrolledTo={isScrolledTo}
        position={highlight.position}
        comment={highlight.comment}
        onClick={() => handlePopoverOpen(highlight)}
        data-highlight-id={highlight._id}
        onMouseLeave={handlePopoverClose}
      />
    ) : (
      <AreaHighlight
        highlight={highlight}
        onChange={(boundingRect) => {
          updateHighlight(highlight.id, {
            boundingRect: viewportToScaled(boundingRect),
            rects: [],
            pageNumber: highlight.position.pageNumber
          });
        }}
        onClick={() => handlePopoverOpen(highlight)}
        data-highlight-id={highlight._id}
        onMouseLeave={handlePopoverClose}
      />
    );
    return component
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
              highlightTransform={highlightTransform}
              highlights={highlights}
              Tip={Tip}
              Highlight={Highlight}
              Popup={Popup}
              AreaHighlight={AreaHighlight}
            />
          )}
        </PdfLoader>
      )}
      {renderDeletePopover()}
    </div>
  );
}
export default BookViewer;
