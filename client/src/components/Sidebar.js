import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Divider, Typography } from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Button } from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <div>{children}</div>
      )}
    </div>
  );
}

function Sidebar({ bookId, highlights, flashcards, onHighlightClick, onFlashcardDelete, onFlashcardEdit }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const exportFlashcards = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/flashcards/export/${bookId}`, {
        responseType: 'blob',
        withCredentials: true
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const a = document.createElement('a');
      a.style = 'display: none';
      document.body.appendChild(a);
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = 'flashcards.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting flashcards:', error);
    }
  };

  const sortHighlights = (highlights) => {
    return highlights.sort((a, b) => {
      if (a.position.pageNumber === b.position.pageNumber) {
        return a.position.boundingRect.y1 - b.position.boundingRect.y1;
      }
      return a.position.pageNumber - b.position.pageNumber;
    });
  };

  const sortedHighlights = sortHighlights(highlights);

  return (
    <div style={{ width: '300px', overflowY: 'auto' }}>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="simple tabs example">
        <Tab label="Highlights" />
        <Tab label="Flashcards" />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
      <Divider />
      <List>
        {sortedHighlights.map((highlight) => (
          <React.Fragment key={highlight._id}>
            <ListItem alignItems="flex-start" button onClick={() => onHighlightClick(highlight._id)}>
              <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {highlight.content.text && (
                  <ListItemText
                    primary={`Page ${highlight.position.pageNumber}`}
                    secondary={
                      <Typography>
                        {highlight.content.text}
                      </Typography>
                    }
                  />
                )}
                {highlight.content.image && 
                  <img src={highlight.content.image} alt="Highlight" style={{ maxWidth: '100%', maxHeight: '100px' }} />
                }
              </div>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FileDownloadIcon />}
          onClick={exportFlashcards}
          style={{ margin: '10px' }}
        >
          Export as CSV
        </Button>
        <List>
          {flashcards.map((flashcard) => (
            <React.Fragment key={flashcard._id}>
              <ListItem alignItems="flex-start" >
                <ListItemText
                  primary={flashcard.frontText}
                  secondary={flashcard.backText}
                />
                <div style={{ marginLeft: 'auto' }}>
                  <IconButton
                    size="small"
                    onClick={() => onHighlightClick(flashcard.highlightId)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={onFlashcardDelete(flashcard._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </TabPanel>
    </div>
  );
}

export default Sidebar;
