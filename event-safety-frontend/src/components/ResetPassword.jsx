// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  Security,
} from '@mui/icons-material';

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Field-level validation error for password strength (frontend only)
  const [fieldErrors, setFieldErrors] = useState({ password: '' });
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token');
    } else {
      setError('');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Password: min 10 chars, 1 uppercase, 1 lowercase, 1 special character
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
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
    setMessage('');

    // Password strength check
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setFieldErrors({ password: passwordError });
      setLoading(false);
      return;
    }
    setFieldErrors({ password: '' });

    // Existing validation — unchanged
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        password: formData.password,
      });
      setMessage(res.data.msg || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Same shared input styling as Login.jsx / Signup.jsx
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

  // Invalid / missing token — no form, just a message + link back
  if (!token) {
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
            maxWidth: 420,
            width: '100%',
            p: { xs: 3, sm: 4 },
            borderRadius: 1,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Security sx={{ fontSize: 34, color: '#667eea', mr: 1.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
              EventGuard
            </Typography>
          </Box>

          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.85rem' }}>
            Invalid reset token
          </Alert>

          <Box textAlign="center">
            <Link
              href="/login"
              sx={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <ArrowBack sx={{ mr: 1, fontSize: '1.1rem' }} />
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Box>
    );
  }

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
          flexDirection: { xs: 'column', md: 'row' },
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
            p: { xs: 3, md: 4 },
            minHeight: { xs: 'auto', md: 480 },
          }}
        >
          <Box sx={{ borderRadius: 3, p: { xs: 1, md: 3 }, textAlign: 'center' }}>
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
              Choose a new password to secure your account and get back to managing your events.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Reset Form */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: { xs: 'auto', md: 480 },
          }}
        >
          <Box sx={{ maxWidth: 380, width: '100%', mx: 'auto' }}>
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}
              >
                Set New Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                Enter your new password below
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
              {/* New Password */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5, fontSize: '0.85rem' }}
              >
                New Password
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Enter new password"
                error={!!fieldErrors.password}
                helperText={
                  fieldErrors.password ||
                  'Min 8 characters, with uppercase, lowercase, and a special character'
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

              {/* Confirm New Password */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#333', mb: 0.5, fontSize: '0.85rem' }}
              >
                Confirm New Password
              </Typography>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Re-enter new password"
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Box>

            <Box textAlign="center">
              <Link
                href="/login"
                sx={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <ArrowBack sx={{ mr: 0.5, fontSize: '1rem' }} />
                Back to Login
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}