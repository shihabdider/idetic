import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Divider, Typography } from '@mui/material';

function Sidebar({ bookId }) {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/highlights?bookId=${bookId}`, { withCredentials: true });
        setHighlights(response.data);
      } catch (error) {
        console.error('Error fetching highlights:', error);
      }
    };

    fetchHighlights();
  }, [bookId]);

  return (
    <div style={{ width: '250px', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ my: 2, mx: 2 }}>
        Highlights
      </Typography>
      <Divider />
      <List>
        {highlights.map((highlight, index) => (
          <React.Fragment key={highlight._id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={`Page ${highlight.position.pageNumber}`}
                secondary={highlight.content.text}
              />
            </ListItem>
            {index < highlights.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </div>
  );
}

export default Sidebar;
