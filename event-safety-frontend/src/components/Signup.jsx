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

  // remember-me removed

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // (Remember-me removed)

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

  // Social signup removed

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 1000,
          width: '100%',
          display: 'flex',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Left Side - Image + Text */}
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
          <Box
            sx={{
            
              borderRadius: 3,
              p: 4,
             
              textAlign: 'center',
            }}
          >
            {/* EventGuard Branding */}
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
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ 
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              Join EventGuard!
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9, 
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Create your account and start protecting your events with our comprehensive security platform.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Signup Form */}
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
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{ 
                  fontWeight: 700, 
                  color: '#333',
                  mb: 1
                }}
              >
                Create Account
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#666',
                  fontSize: '1rem'
                }}
              >
                Fill in your details to get started
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  fontSize: '0.9rem'
                }}
              >
                {error}
              </Alert>
            )}

            {/* Signup Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Username */}
              {/* Username */}


<Stack spacing={0}>  {/* spacing={1} means 8px gap */}
  <TextField
    id="standard-username"
    label="Username"
    variant="standard"
    required
    fullWidth
    name="username"
    value={formData.username}
    onChange={handleUsernameChange}
    autoComplete="username"
    InputLabelProps={{
      shrink: true,
      sx: {
        backgroundColor: 'white',
        px: 0.5,
        position: 'relative',
        zIndex: 1,
        '&.MuiInputLabel-shrink': {
          transform: 'translate(0, 20px) scale(1)',
        },
      },
    }}
  />

  <TextField
    id="standard-email"
    label="Email Address"
    variant="standard"
    required
    fullWidth
    type="email"
    name="email"
    value={formData.email}
    onChange={handleEmailChange}
    autoComplete="email"
    InputLabelProps={{
      shrink: true,
      sx: {
        backgroundColor: 'white',
        px: 0.5,
        position: 'relative',
        zIndex: 1,
        '&.MuiInputLabel-shrink': {
          transform: 'translate(0, 20px) scale(1)',
        },
      },
    }}
  />

  <TextField
    id="standard-password"
    label="Password"
    variant="standard"
    required
    fullWidth
    type="password"
    name="password"
    value={formData.password}
    onChange={handlePasswordChange}
    autoComplete="new-password"
    InputLabelProps={{
      shrink: true,
      sx: {
        backgroundColor: 'white',
        px: 0.5,
        position: 'relative',
        zIndex: 1,
        '&.MuiInputLabel-shrink': {
          transform: 'translate(0, 20px) scale(1)',
        },
      },
    }}
    InputProps={{
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
      }}
  />

  <TextField
    id="standard-confirmPassword"
    label="Confirm Password"
    variant="standard"
    required
    fullWidth
    type="password"
    name="confirmPassword"
    value={formData.confirmPassword}
    onChange={handleConfirmPasswordChange}
    autoComplete="new-password"
    InputLabelProps={{
      shrink: true,
      sx: {
        backgroundColor: 'white',
        px: 0.5,
        position: 'relative',
        zIndex: 1,
        '&.MuiInputLabel-shrink': {
          transform: 'translate(0, 20px) scale(1)',
        },
      },
    }}
    InputProps={{
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
      }}
  />
</Stack>



                {/* Remember-me removed */}

              {/* Create Account Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  marginTop: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: '#667eea',
                  color: 'white',
                  mb: 3,
                  '&:hover': {
                    backgroundColor: '#5a6fd8',
                  },
                  '&:disabled': {
                    backgroundColor: '#b8c2f0',
                  },
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>

            {/* Social signup removed */}

            {/* Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ 
                  color: '#666',
                  fontSize: '0.95rem',
                }}
              >
                Already have an account?{' '}
                <Link
                  href="/login"
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 700,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
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
