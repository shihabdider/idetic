import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Divider, Typography } from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Button } from '@mui/material';
import TextField from '@mui/material/TextField';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HighlightIcon from '@mui/icons-material/Highlight';
import StyleIcon from '@mui/icons-material/Style';
import SimpleChat from './SimpleChat';
import { MessageInput } from "@chatscope/chat-ui-kit-react";

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
  const [editingFlashcardId, setEditingFlashcardId] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'frontText' or 'backText'
  const [editText, setEditText] = useState('');
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

  const handleFlashcardEdit = (flashcardId, field) => {
    setEditingFlashcardId(flashcardId);
    setEditingField(field);
    const flashcard = flashcards.find(fc => fc._id === flashcardId);
    setEditText(flashcard ? flashcard[field] : '');
    console.log(editText);
  };

  const handleEditChange = (event) => {
    setEditText(event.target.value);
    console.log('editText', editText);
  };

  const handleEditBlur = () => {
    if (editingFlashcardId && editingField) {
      onFlashcardEdit(editingFlashcardId, editingField, editText);
    }
    setEditingFlashcardId(null);
    setEditingField(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleEditBlur();
    }
  };

  return (
    <div style={{ width: '300px', overflowY: 'auto' }}>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="simple tabs example">
        <Tab icon={<HighlightIcon />} aria-label="Highlights" />
        <Tab icon={<StyleIcon />} aria-label="Flashcards" />
        <Tab icon={<ChatBubbleOutlineIcon />} aria-label="Chat" />
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
                    secondary={highlight.content.text}
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
              <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {editingFlashcardId === flashcard._id && editingField === 'frontText' ? (
                  <TextField
                    fullWidth
                    multiline
                    variant="standard"
                    value={editText}
                    onChange={handleEditChange}
                    onBlur={handleEditBlur}
                    onKeyPress={handleKeyPress}
                    autoFocus
                  />
                ) : (
                  <ListItemText
                    primary={flashcard.frontText}
                    onClick={() => handleFlashcardEdit(flashcard._id, 'frontText')}
                  />
                )}
                {editingFlashcardId === flashcard._id && editingField === 'backText' ? (
                  <TextField
                    fullWidth
                    multiline
                    variant="standard"
                    value={editText}
                    onChange={handleEditChange}
                    onBlur={handleEditBlur}
                    onKeyPress={handleKeyPress}
                    autoFocus
                  />
                ) : (
                  <ListItemText
                    secondary={flashcard.backText}
                    onClick={() => handleFlashcardEdit(flashcard._id, 'backText')}
                  />
                )}
                <div style={{ marginLeft: 'auto' }}>
                  <IconButton
                    size="small"
                    onClick={() => onHighlightClick(flashcard.highlightId)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onFlashcardDelete(flashcard._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {/* Removed SimpleChat and placed MessageInput at the bottom */}
      </TabPanel>
    </div>
    <MessageInput placeholder="Type message here" style={{ position: "absolute", bottom: 0, width: "100%" }} />
  );
}

export default Sidebar;
