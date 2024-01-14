import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import { AppBar, Divider, Toolbar, Typography, IconButton, Popover, Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import _ from 'lodash';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuIcon from '@mui/icons-material/Menu'; 
import Sidebar from './Sidebar';

function BookViewer() {
  const { id } = useParams();
  const [pdfTitle, setPdfTitle] = useState('');
  const pdfHighlighterRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [highlightIdOfScrolledTo, setHighlightIdOfScrolledTo] = useState(null);
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
        setScrollPosition(response.data.scrollPosition || 0);
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

  useEffect(() => {
    const handleScroll = _.debounce((event) => {
      const currentScrollPosition = event.target.scrollTop;
      setScrollPosition(currentScrollPosition);
      console.log('Scroll position:', currentScrollPosition);
    }, 100);

    const pdfHighlighterElement = document.querySelector('.PdfHighlighter');

    pdfHighlighterElement?.addEventListener('scroll', handleScroll);

    return () => pdfHighlighterElement?.removeEventListener('scroll', handleScroll);
  });

  useEffect(() => {
    const pdfHighlighterElement = document.querySelector('.PdfHighlighter');
    if (pdfHighlighterElement) {
      pdfHighlighterElement.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    } else {
      console.log('PdfHighlighter element not found');
    }
  }, []);

  useEffect(() => {
    const saveScrollPosition = _.debounce(async () => {
      try {
        await axios.patch(`http://localhost:3001/books/${id}/scroll-position`, { scrollPosition }, { withCredentials: true });
      } catch (error) {
        console.error('Error updating scroll position:', error);
      }
    }, 500);
    saveScrollPosition();
  }, [scrollPosition, id]);

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

  const generateFlashcards = async (highlight) => {
    try {
      const pageText = "The entire text of the page where the highlight is found"; // Replace with actual page text retrieval logic
      const response = await axios.post('http://localhost:3001/flashcards/generate-with-gpt', {
        highlight: highlight.content.text,
        page: pageText
      }, { withCredentials: true });
      console.log('Generated flashcards:', response.data);
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
  }

  const renderHighlightPopover = () => (
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
        title="Delete Highlight"
        startIcon={<DeleteOutlineIcon />}
        onClick={() => {deleteHighlight(highlightToDelete._id); handlePopoverClose()}}
        color="error"
        size="small"
      >
      </Button>
      <Button
        title="Generate Flashcard"
        size="small"
        startIcon={<QuizIcon />}
        onClick={() => {generateFlashcards(highlight); handlePopoverClose()}}
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

  const highlightTransform = (highlight, index, viewportToScaled, screenshot) => {
    const isTextHighlight = !Boolean(highlight.content.image);
    const component = isTextHighlight ? (
      <div id={highlight._id}>
        <Highlight
          key={highlight._id}
          position={highlight.position}
          comment={highlight.comment}
          onClick={(e) => handlePopoverOpen(e, highlight)}
          onMouseLeave={handlePopoverClose}
        />
      </div>
    ) : (
      <div id={highlight._id}>
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
      </div>
    );
    return component
  };

  const scrollToHighlight = (highlightId) => {
    setHighlightIdOfScrolledTo(highlightId);
  };

  useEffect(() => {
    if (highlightIdOfScrolledTo) {
      const highlight = highlights.find(h => h._id === highlightIdOfScrolledTo);
      if (highlight) {
        const pageNumber = highlight.position.pageNumber;
        const highlightElement = document.querySelector(`[id="${highlight._id}"]`);
        console.log(highlightElement);
        const pageElement = document.querySelector(`div[data-page-number="${pageNumber}"]`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (highlightElement) {
          const firstHighlightPart = highlightElement.querySelector('.Highlight__part');
          console.log(firstHighlightPart);
          if (firstHighlightPart) {
            firstHighlightPart.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      setHighlightIdOfScrolledTo(null);
    }
  }, [highlightIdOfScrolledTo, highlights]);


  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>
        <AppBar position="fixed" sx={{
             background: 'white',
             color: 'black',
             boxShadow: sidebarVisible ? '0px 2px 4px -1px rgba(0,0,0,0.2)' : 'none',
             transition: 'box-shadow 0s',
             marginRight: '16px',
             }}
          >
          <Toolbar>
            <IconButton edge="start" color="default" aria-label="back" onClick={goBackToLibrary} style={{ marginLeft: '16px'}}>
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
              scrollRef={() => {}}
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onUpdateHighlight={updateHighlight}
              onSelectionFinished={onSelectionFinished}
              highlightTransform={highlightTransform}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      )}
      </div>
      {sidebarVisible && <Divider orientation="vertical" flexItem style={{ marginRight: '12px' }}/>}
      {sidebarVisible && (
        <div style={{ width: '250px', marginTop: '64px', marginRight: '48px', display: 'flex', flexDirection: 'column' }}>
          <Sidebar highlights={highlights} onHighlightClick={scrollToHighlight} />
        </div>
      )}
      {renderHighlightPopover()}
    </div>
  );
}
export default BookViewer;
