import { useState, useEffect, useRef, useReducer } from 'react';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import { AppBar, Divider, Toolbar, Typography, IconButton, Popover, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import _ from 'lodash';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuIcon from '@mui/icons-material/Menu'; 
import Sidebar from './Sidebar';

function BookViewer() {
  const { id } = useParams();
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfDocumentInstance, setPdfDocumentInstance] = useState(null);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [highlightIdOfScrolledTo, setHighlightIdOfScrolledTo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
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
        // Load the PDF document instance
        const loadingTask = pdfjsLib.getDocument(fullPdfUrl);
        loadingTask.promise.then((pdfDoc) => {
          setPdfDocumentInstance(pdfDoc);
        });
      } catch (error) {
        console.error('Error fetching PDF document:', error);
      }
    };

    const fetchHighlights = async () => {
      const response = await axios.get(`http://localhost:3001/highlights?bookId=${id}`, { withCredentials: true });
      setHighlights(response.data);
      const flashcardsResponse = await axios.get(`http://localhost:3001/flashcards/book/${id}`, { withCredentials: true });
      setFlashcards(flashcardsResponse.data);
    };

    fetchPdfDocument();
    fetchHighlights();
  }, [id]);

  const getPageText = async (pageNumber) => {
    if (!pdfDocumentInstance) {
      console.error('PDF document instance is not loaded yet.');
      return '';
    }
    try {
      const page = await pdfDocumentInstance.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => item.str);
      return textItems.join(' ');
    } catch (error) {
      console.error(`Error fetching text for page ${pageNumber}:`, error);
      return '';
    }
  };

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
    console.log(pdfHighlighterElement);

    pdfHighlighterElement?.addEventListener('scroll', handleScroll);


    return () => pdfHighlighterElement?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const pdfHighlighterElement = document.querySelector('.PdfHighlighter');
    if (pdfHighlighterElement) {
      console.log('Scrolling to position:', scrollPosition);
      // pdfHighlighterElement.scrollTo({ top: scrollPosition, behavior: 'smooth' });
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
        setSelectedHighlight(null);
      })
      .catch(error => {
        console.error('Error deleting highlight:', error);
      });
  };

  const generateFlashcards = async (highlight) => {
    setIsGeneratingFlashcards(true);
    try {
      const pageText = await getPageText(highlight.position.pageNumber);
      const response = await axios.post('http://localhost:3001/flashcards/generate-with-gpt', {
        highlight: highlight.content.text,
        page: pageText
      }, { withCredentials: true });
      console.log('Generated flashcards:', response.data.flashcards);
      // Collect all new flashcards in a batch to update the state at once
      const newFlashcards = await Promise.all(response.data.flashcards.map(flashcard =>
        axios.post('http://localhost:3001/flashcards', {
          frontText: flashcard.question,
          backText: flashcard.answer,
          highlightId: highlight._id,
          bookId: id
        }, { withCredentials: true }).then(response => response.data)
      ));
      setFlashcards([...flashcards, ...newFlashcards]);
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
    setIsGeneratingFlashcards(false);
  };

  const updateFlashcard = async (flashcardId, updatingField, updatingText) => {
    try {
      const response = await axios.put(`http://localhost:3001/flashcards/${flashcardId}`, {
        [updatingField]: updatingText,
      }, { withCredentials: true });
      const updatedFlashcards = flashcards.map(flashcard => {
        if (flashcard._id === flashcardId) {
          return { ...flashcard, [updatingField]: updatingText };
        }
        return flashcard;
      });
      setFlashcards(updatedFlashcards);
      console.log('Flashcard updated:', response.data);
    } catch (error) {
      console.error('Error updating flashcard:', error);
    }
  }

  const deleteFlashcard = async (flashcardId) => {
    try {
      await axios.delete(`http://localhost:3001/flashcards/${flashcardId}`, { withCredentials: true });
      setFlashcards(flashcards.filter(h => h._id !== flashcardId));
      console.log('Flashcard deleted:', flashcardId);
    } catch (error) {
      console.error('Error deleting flashcard:', error);
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
        onClick={() => {deleteHighlight(selectedHighlight._id); handlePopoverClose()}}
        color="error"
        size="small"
      >
      </Button>
    {isGeneratingFlashcards ? (
      <CircularProgress size={14} style={{ marginRight: 10 }} />
    ) : (
        <Button
          title="Generate Flashcard"
          size="small"
          startIcon={<QuizIcon />}
          onClick={() => {generateFlashcards(selectedHighlight)}}
          disabled={isGeneratingFlashcards}
        >
        </Button>
      )}
    </Popover>
  );

  const handlePopoverOpen = (event, highlight) => {
    console.log(event.currentTarget);
    setAnchorEl(event.currentTarget);
    setSelectedHighlight(highlight);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedHighlight(null);
  };

  const toggleSidebar = () => {
    const newSidebarVisible = !sidebarVisible;
    setSidebarVisible(newSidebarVisible);
    const pdfViewerElement = document.querySelector('.pdf-viewer-container');
    if (pdfViewerElement) {
      pdfViewerElement.style.transition = 'transform 0.1s ease-in-out';
      if (newSidebarVisible) {
        pdfViewerElement.style.transform = 'translateX(0)'; // Adjust the value as needed for your sidebar width
      }
    }
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
      <div className="pdf-viewer-container" style={{ display: 'flex', flexGrow: 1}}>
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
        <div style={{ background: "white", marginTop: '64px', marginRight: '8px', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
          <Sidebar bookId={id} highlights={highlights} flashcards={flashcards}
            onHighlightClick={scrollToHighlight}
            onFlashcardDelete={deleteFlashcard}
            onFlashcardEdit={updateFlashcard}/>
        </div>
      )}
      {renderHighlightPopover()}
    </div>
  );
}
export default BookViewer;
