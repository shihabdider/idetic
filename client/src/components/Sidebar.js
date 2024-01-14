import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Divider, Typography, Tabs, Tab, Box } from '@mui/material';

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
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function Sidebar({ highlights, onHighlightClick }) {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
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
    <div style={{ width: '250px', overflowY: 'auto', position: 'relative', zIndex: 1000 }}>
      <Typography variant="h6" sx={{ my: 2, mx: 2 }}>
        Highlights
      </Typography>
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
    </div>
  );
}

export default Sidebar;
