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
  FormControlLabel,
  Checkbox,
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
  Google,
  Security,
} from '@mui/icons-material';
import { socket } from '../socket';

export default function Login({ setAuth }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Enhanced remember password functionality
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        password: savedPassword,
        rememberMe: true,
      }));
    }
  }, []);

  // Auto-fill password when email matches saved credentials
  const handleEmailChange = (e) => {
    const email = e.target.value;
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');

    setFormData((prev) => ({
      ...prev,
      email: email,
      password: email === savedEmail ? savedPassword : prev.password,
      rememberMe: email === savedEmail ? true : prev.rememberMe,
    }));
  };

  const handlePasswordChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      password: e.target.value,
    }));
  };

  const handleRememberMeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      rememberMe: e.target.checked,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedPassword', formData.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

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

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
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
          <Box
            sx={{
              
              borderRadius: 3,
              p: 4,
              
              textAlign: 'center',
            }}
          >
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
                fontSize: { xs: '1.8rem', md: '2.2rem' },
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.9,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Sign in to continue managing your events safely and efficiently with EventGuard.
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
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: '#333',
                  mb: 1,
                }}
              >
                Sign In
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', fontSize: '1rem' }}>
                Enter your credentials to access your account
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  fontSize: '0.9rem',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
  required
  fullWidth
  variant="outlined"
  label="Email Address"
  type="email"
  name="email"
  value={formData.email}
  onChange={handleEmailChange}
  autoComplete="email"
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <Email sx={{ color: '#999', fontSize: '1.2rem' }} />
      </InputAdornment>
    ),
  }}
  sx={{
    mb: 2,
    
    '& .MuiInputLabel-root': {
      color: '#666',
      '&.Mui-focused': {
        color: '#667eea',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e0e0e0',
      borderWidth: '1px',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#667eea',
      borderWidth: '2px',
    },
  }}
/>


              <TextField
                required
                fullWidth
                margin="normal"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#999', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#999' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    '&.Mui-focused': {
                      color: '#667eea',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0',
                    borderWidth: '1px',
                  },
                  
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 4,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      onChange={handleRememberMeChange}
                      name="rememberMe"
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        color: '#666',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                    >
                      Remember me
                    </Typography>
                  }
                />
                <Link
                  href="/forgot-password"
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
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
                  borderRadius: 2,
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Divider sx={{ flex: 1, backgroundColor: '#e0e0e0' }} />
              <Typography
                sx={{
                  mx: 2,
                  color: '#999',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                OR
              </Typography>
              <Divider sx={{ flex: 1, backgroundColor: '#e0e0e0' }} />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                border: '2px solid #e0e0e0',
                color: '#333',
                backgroundColor: 'white',
                mb: 3,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#667eea',
                  backgroundColor: '#f8f9fa',
                  color: '#667eea',
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
                    '&:hover': {
                      textDecoration: 'underline',
                    },
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
