import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  FormControlLabel,
  Checkbox,
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
  Google,
} from '@mui/icons-material';

export default function Signup({ setAuth }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        password: savedPassword,
        confirmPassword: savedPassword,
        rememberMe: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value,
    }));
  };

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

      // Handle remember me functionality
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 5,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography
              component="h1"
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              Join EventGuard
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '1.1rem',
                fontWeight: 500,
              }}
            >
              Create your account to get started
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4, 
                borderRadius: 2,
                fontSize: '0.95rem',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            {/* Username */}
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-focused': {
                    color: '#667eea',
                    fontWeight: 600,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  borderWidth: '1px',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#667eea', fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                style: { fontSize: '1rem' },
              }}
            />

            {/* Email */}
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-focused': {
                    color: '#667eea',
                    fontWeight: 600,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  borderWidth: '1px',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#667eea', fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                style: { fontSize: '1rem' },
              }}
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-focused': {
                    color: '#667eea',
                    fontWeight: 600,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  borderWidth: '1px',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea', fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: '#667eea' },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                style: { fontSize: '1rem' },
              }}
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-focused': {
                    color: '#667eea',
                    fontWeight: 600,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  borderWidth: '1px',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea', fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: '#667eea' },
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                style: { fontSize: '1rem' },
              }}
            />

            {/* Remember Me Checkbox */}
            <Box sx={{ mb: 4 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    sx={{
                      color: '#667eea',
                      '&.Mui-checked': {
                        color: '#667eea',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ 
                    color: 'text.secondary', 
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}>
                    Remember my credentials for future logins
                  </Typography>
                }
              />
            </Box>

            {/* Signup Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #b8c2f0 0%, #c4b5d9 100%)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  transform: 'none',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Divider sx={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
            <Typography sx={{ 
              mx: 3, 
              color: 'text.secondary', 
              fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              OR
            </Typography>
            <Divider sx={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
          </Box>

          {/* Google Signup Button */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignup}
            startIcon={<Google />}
            sx={{
              py: 2,
              borderRadius: 3,
              fontSize: '1rem',
              fontWeight: 600,
              border: '2px solid rgba(0, 0, 0, 0.1)',
              color: 'text.primary',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                border: '2px solid #667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                color: '#667eea',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Continue with Google
          </Button>

          {/* Login Link */}
          <Box textAlign="center" mt={4}>
            <Typography sx={{ 
              color: 'text.secondary', 
              fontSize: '1rem',
              fontWeight: 500,
            }}>
              Already have an account?{' '}
              <Link
                href="/login"
                sx={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 700,
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#764ba2',
                  },
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
