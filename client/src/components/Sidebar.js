import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Divider, Typography } from '@mui/material';

import { Tabs, Tab } from '@mui/material';

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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Button from '@mui/material/Button';

function Sidebar({ highlights, flashcards, onHighlightClick }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const exportFlashcards = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/flashcards/export`, {
        responseType: 'blob', // Important
        withCredentials: true
      });
      // Create a new Blob object using the response data of the onload object
      const blob = new Blob([response.data], { type: 'text/csv' });
      // Create a link element, hide it, direct it towards the blob, and then 'click' it programatically
      const a = document.createElement('a');
      a.style = 'display: none';
      document.body.appendChild(a);
      // Create a DOMString representing the blob and point the link element towards it
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = 'flashcards.csv';
      // programatically click the link to trigger the download
      a.click();
      // release the reference to the file by revoking the Object URL
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
    <div style={{ width: '250px', overflowY: 'auto' }}>
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
              <div style={{ height: '128px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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
              <ListItem alignItems="flex-start" button onClick={() => onHighlightClick(flashcard.highlightId)}>
                <ListItemText
                  primary={flashcard.frontText}
                  secondary={flashcard.backText}
                />
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
