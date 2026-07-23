import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

export default function PendingApproval() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        fontFamily: 'Inter, Roboto, sans-serif',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 900,
          width: '100%',
          display: 'flex',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 5,
            minHeight: 420,
          }}
        >
          <Box sx={{ maxWidth: 420 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <SecurityIcon sx={{ fontSize: 36, color: '#ffd700' }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EventGuard
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1rem', lineHeight: 1.6 }}>
              Your account has been created successfully. It is now awaiting approval from the team head.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 420,
          }}
        >
          <Box sx={{ maxWidth: 420, width: '100%', mx: 'auto' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
              Waiting for Head Approval
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
              We have received your registration. Once your team head approves the account, you will be able to log in and access the dashboard.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                sx={{ py: 1.2, fontWeight: 700, textTransform: 'none' }}
              >
                Back to Login
              </Button>
              <Button
                component={Link}
                to="/"
                variant="outlined"
                sx={{ py: 1.2, fontWeight: 700, textTransform: 'none' }}
              >
                Return Home
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
