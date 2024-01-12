import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Divider, Typography } from '@mui/material';

function Sidebar({ highlights, onHighlightClick }) {
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
      <Typography variant="h6" sx={{ my: 2, mx: 2 }}>
        Highlights
      </Typography>
      <Divider />
      <List>
        {sortedHighlights.map((highlight) => (
          <React.Fragment key={highlight._id}>
            <ListItem alignItems="flex-start" button onClick={() => onHighlightClick(highlight._id)}>
              <div style={{ height: '128px', overflow: 'hidden' }}>
                <ListItemText
                  primary={`Page ${highlight.position.pageNumber}`}
                  secondary={
                    <Typography>
                      {highlight.content.text}
                    </Typography>
                  }
                />
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
