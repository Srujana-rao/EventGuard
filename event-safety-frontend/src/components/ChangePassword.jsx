// src/components/ChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Email,
  ArrowBack,
  Security,
} from '@mui/icons-material';

export default function ChangePassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim(),
      });
      setMessage(res.data.msg || 'Password reset email sent successfully!');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Same shared input styling as Login.jsx / Signup.jsx / ForgotPassword.jsx
  const inputSx = {
    backgroundColor: '#f9fafb',
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px !important',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: '6px !important',
    },
    '& .MuiOutlinedInput-input': {
      border: 'none !important',
      outline: 'none !important',
      boxShadow: 'none !important',
      backgroundColor: 'transparent !important',
    },
    '& fieldset': { borderColor: '#e5e7eb' },
    '&:hover fieldset': { borderColor: '#667eea' },
    '&.Mui-focused fieldset': { borderColor: '#667eea' },
  };

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
          maxWidth: 950,
          width: '100%',
          display: 'flex',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Left Side - Branding */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 4,
            minHeight: 480,
          }}
        >
          <Box sx={{ borderRadius: 3, p: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Security sx={{ fontSize: 34, color: '#ffd700', mr: 1.5 }} />
              <Typography
                variant="h5"
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

            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                fontSize: '1rem',
                lineHeight: 1.5,
              }}
            >
              No worries — enter your email and we'll send you a link to get back into your account.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Change Password Form */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 480,
          }}
        >
          <Box sx={{ maxWidth: 380, width: '100%', mx: 'auto' }}>
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}
              >
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                Enter your email to receive a password reset link
              </Typography>
            </Box>

            {message && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                {message}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5, fontSize: '0.85rem' }}
              >
                Email
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="Enter your email"
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9ca3af', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.1,
                  borderRadius: 1,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  backgroundColor: '#667eea',
                  color: 'white',
                  mb: 2,
                  '&:hover': { backgroundColor: '#5a6fd8' },
                  '&:disabled': { backgroundColor: '#b8c2f0' },
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>

            <Box textAlign="center">
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/settings')}
                sx={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <ArrowBack sx={{ mr: 0.5, fontSize: '1rem' }} />
                Back to Settings
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
