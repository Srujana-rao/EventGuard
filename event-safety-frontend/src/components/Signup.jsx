import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Security,
} from '@mui/icons-material';

// Simple Google "G" logo as inline SVG (same as Login.jsx)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 5.5 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11.3 0 20.5-9.2 20.5-20.5 0-1.4-.1-2.7-.3-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.9 15.5 18.6 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.5 29.2 4.5 24 4.5c-7.5 0-14 4.2-17.3 10.3z"/>
    <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.2-7.2 2.2-5.3 0-9.7-3.4-11.3-8.1l-6 4.6C9.9 40.3 16.4 44.5 24 44.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.4-2.4 4.4-4.4 5.8l6.2 5.2C40.5 35.7 44.5 30.6 44.5 24c0-1.4-.1-2.7-.3-3.5z"/>
  </svg>
);

export default function Signup({ setAuth }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Field-level validation errors (frontend only — doesn't touch backend logic)
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
  };

  const handleConfirmPasswordChange = (e) => {
    setFormData(prev => ({
      ...prev,
      confirmPassword: e.target.value,
    }));
  };

  const handleUsernameChange = (e) => {
    setFormData(prev => ({
      ...prev,
      username: e.target.value,
    }));
  };

  // Basic email check: must contain @ and be a valid format
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
  const validatePassword = (password) => {
    if (password.length < 10) {
      return 'Password must be at least 10 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must include at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must include at least one lowercase letter';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password)) {
      return 'Password must include at least one special character';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      setLoading(false);
      return;
    }
    setFieldErrors({ email: '', password: '' });

    // Existing validation — unchanged
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAuth(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google signup placeholder — wire up to your actual OAuth flow when ready
  const handleGoogleSignup = () => {
    console.log('Google sign-up clicked — connect this to your OAuth flow');
  };

  // Same shared input styling as Login.jsx
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
              Create your account and manage event security from one place.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Signup Form */}
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
                Create Account
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                Fill in your details to get started with EventGuard.
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5, fontSize: '0.85rem' }}
              >
                Username
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                name="username"
                value={formData.username}
                onChange={handleUsernameChange}
                autoComplete="username"
                placeholder="Choose a username"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#9ca3af', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />

              {/* Email */}
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
                value={formData.email}
                onChange={handleEmailChange}
                autoComplete="email"
                placeholder="Enter your email"
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                sx={{ mb: fieldErrors.email ? 0.5 : 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9ca3af', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />

              {/* Password */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5, fontSize: '0.85rem' }}
              >
                Password
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                placeholder="Create a password"
                error={!!fieldErrors.password}
                helperText={
                  fieldErrors.password ||
                  'Min 10 characters, with uppercase, lowercase, and a special character'
                }
                sx={{ mb: fieldErrors.password ? 0.5 : 2 }}
                FormHelperTextProps={{ sx: { fontSize: '0.7rem', mx: 0 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9ca3af', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: inputSx,
                }}
              />

              {/* Confirm Password */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5, fontSize: '0.85rem' }}
              >
                Confirm Password
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9ca3af', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((show) => !show)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>

            {/* Divider + Google Sign-Up */}
            <Divider sx={{ mb: 2, color: '#9ca3af', fontSize: '0.8rem' }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignup}
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.1,
                borderRadius: 1,
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#333',
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff',
                mb: 2,
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
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                Already have an account?{' '}
                <Link
                  href="/login"
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 700,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}