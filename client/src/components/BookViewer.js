import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import { AppBar, Divider, Toolbar, Typography, IconButton, Popover, Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu'; 
import Sidebar from './Sidebar';

function BookViewer() {
  const { id } = useParams();
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfDocument, setPdfDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [highlightToDelete, setHighlightToDelete] = useState(null);
  const navigate = useNavigate();
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [sidebarVisible, setSidebarVisible] = useState(false); 

  useEffect(() => {
    const fetchPdfDocument = async () => {
      try {
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
        image: highlight.content.image 
      },
      position: highlight.position,
      comment: highlight.comment, 
      bookId: id 
    }, { withCredentials: true })
    .then(response => {
      setHighlights([...highlights, response.data]);
      console.log('Highlights:', highlights); 
    })
    .catch(error => {
      console.error('Error saving highlight:', error);
    });
  };

  const updateHighlight = (highlight, position, content) => {
    console.log('Updating highlight', highlight)
    axios.put(`http://localhost:3001/highlights/${highlight._id}`, {
      content: {
        text: content?.text,
        image: content?.image
      },
      position: {
        boundingRect: position?.boundingRect,
        rects: position?.rects,
        pageNumber: position?.pageNumber
      }
    }, { withCredentials: true })
    .then(response => {
      const index = highlights.findIndex(h => h._id === highlight._id);
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
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Button
        startIcon={<DeleteOutlineIcon />}
        onClick={() => {deleteHighlight(highlightToDelete._id); handlePopoverClose()}}
        color="error"
      >
      </Button>
    </Popover>
  );

  const handlePopoverOpen = (event, highlight) => {
    console.log(event.currentTarget);
    setAnchorEl(event.currentTarget);
    setHighlightToDelete(highlight);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setHighlightToDelete(null);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
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
        key={highlight._id}
        isScrolledTo={isScrolledTo}
        position={highlight.position}
        comment={highlight.comment}
        onClick={(e) => handlePopoverOpen(e, highlight)}
        onMouseLeave={handlePopoverClose}
      />
    ) : (
      <AreaHighlight
        key={highlight._id}
        highlight={highlight}
        onChange={(boundingRect) => {
          updateHighlight(highlight, {
            boundingRect: viewportToScaled(boundingRect),
            pageNumber: highlight.position.pageNumber
          }, { image: screenshot(boundingRect)});
        }}
        onClick={(e) => handlePopoverOpen(e, highlight)}
      />
    );
    return component
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>
        <AppBar position="fixed" sx={{
             background: 'white',
             color: 'black',
             boxShadow: 'none',
             marginLeft: '16px',
             marginRight: '16px',
             }}
          >
          <Toolbar>
            <IconButton edge="start" color="default" aria-label="back" onClick={goBackToLibrary}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h7" noWrap style={{ color: 'black' }}>
              { pdfTitle }
            </Typography>
            <IconButton edge="end" color="default" aria-label="menu" onClick={toggleSidebar} style={{ marginLeft: 'auto', marginRight: '8px' }}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      <div style={{ display: 'flex', flexGrow: 1}}>
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
      </div>
      {sidebarVisible && <Divider orientation="vertical" flexItem style={{ marginRight: '12px' }}/>}
      {sidebarVisible && (
        <div style={{ width: '250px', marginTop: '64px', marginRight: '48px', display: 'flex', flexDirection: 'column' }}>
          <Sidebar highlights={highlights} />
        </div>
      )}
      {renderDeletePopover()}
    </div>
  );
}
export default BookViewer;
