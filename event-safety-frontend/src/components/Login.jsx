import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Security,
} from '@mui/icons-material';
import { socket } from '../socket';

// Simple Google "G" logo as inline SVG (no extra package needed)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 5.5 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11.3 0 20.5-9.2 20.5-20.5 0-1.4-.1-2.7-.3-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.9 15.5 18.6 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.5 29.2 4.5 24 4.5c-7.5 0-14 4.2-17.3 10.3z"/>
    <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.2-7.2 2.2-5.3 0-9.7-3.4-11.3-8.1l-6 4.6C9.9 40.3 16.4 44.5 24 44.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.4-2.4 4.4-4.4 5.8l6.2 5.2C40.5 35.7 44.5 30.6 44.5 24c0-1.4-.1-2.7-.3-3.5z"/>
  </svg>
);

export default function Login({ setAuth }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Field-level validation errors (frontend only — doesn't touch backend logic)
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData((prev) => ({ ...prev, email }));
  };

  const handlePasswordChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      password: e.target.value,
    }));
  };

  // Basic email check: must contain @ and something after it with a dot
  const validateEmail = (email) => {
    if (!email.includes('@')) {
      return 'Email must contain @';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Enter a valid email address';
    }
    return '';
  };

  // Password: min 10 chars, 1 uppercase, 1 lowercase, 1 special character
  

  const handleSubmit = async (event) => {
  event.preventDefault();

  // Only validate email — password conditions removed since existing accounts were created without them
  const emailError = validateEmail(formData.email);

  if (emailError) {
    setFieldErrors({ email: emailError, password: '' });
    return;
  }

  setFieldErrors({ email: '', password: '' });
  setLoading(true);
  setError('');

  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: formData.email,
      password: formData.password,
    });

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setAuth(true);

    setTimeout(() => {
      if (!socket.connected) {
        console.log('Connecting socket after login...');
        socket.connect();
      }
      socket.once('connect', () => {
        console.log('Socket connected after login, authenticating...');
        socket.emit('authenticate', res.data.token);
      });
      if (socket.connected) {
        console.log('Socket already connected after login, authenticating...');
        socket.emit('authenticate', res.data.token);
      }
    }, 100);

    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.msg || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Google login placeholder — wire up to your actual OAuth flow when ready
  const handleGoogleLogin = () => {
    console.log('Google sign-in clicked — connect this to your OAuth flow');
  };

  // Shared styling for the rounded, icon-adorned inputs (matches reference layout)
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
          maxWidth: 1000,
          width: '100%',
          display: 'flex',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Left Side - Branding & Welcome */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 6,
            minHeight: 600,
          }}
        >
          <Box sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <Security sx={{ fontSize: 40, color: '#ffd700', mr: 2 }} />
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

            <Typography
              variant="body1"
              sx={{
                opacity: 0.9,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Sign in to continue managing event security with EventGuard.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Login Form */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 600,
          }}
        >
          <Box sx={{ maxWidth: 400, width: '100%', mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700, color: '#333', mb: 1 }}
              >
                Welcome Back!
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', fontSize: '1rem' }}>
                Sign in to access your dashboard and continue with EventGuard.
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2, fontSize: '0.9rem' }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}
              >
                Email
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                type="email"
                name="email"
                value={formData.email}
                onChange={handleEmailChange}
                autoComplete="email"
                placeholder="Enter your email"
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                sx={{ mb: fieldErrors.email ? 1 : 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />

              {/* Password */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}
              >
                Password
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                placeholder="Enter your password"
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 4 }}>
                <Link
                  href="/forgot-password"
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: '#667eea',
                  color: 'white',
                  mb: 3,
                  '&:hover': { backgroundColor: '#5a6fd8' },
                  '&:disabled': { backgroundColor: '#b8c2f0' },
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            {/* Divider + Google Sign-In */}
            <Divider sx={{ mb: 3, color: '#9ca3af', fontSize: '0.85rem' }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleLogin}
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.5,
                borderRadius: 1,
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#333',
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff',
                mb: 3,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#d1d5db',
                  backgroundColor: '#f1f3f6',
                },
              }}
            >
              Continue with Google
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.95rem' }}>
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 700,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}