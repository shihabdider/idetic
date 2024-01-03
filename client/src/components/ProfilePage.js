import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

function ProfilePage() {
  // Placeholder user data, replace with actual data from your auth system
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com'
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          sx={{
            marginTop: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 2,
          }}
        >
          <Typography component="h1" variant="h5">
            Profile
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Name: {user.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Email: {user.email}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default ProfilePage;
