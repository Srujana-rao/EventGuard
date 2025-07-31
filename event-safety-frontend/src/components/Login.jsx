import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// MUI Components
import { TextField, Button, Box, Typography, IconButton, Divider, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
// Social Icons
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';

const AuthBox = styled(Box)(({ theme }) => ({
  maxWidth: 450,
  margin: theme.spacing(6) + ' auto',
  padding: theme.spacing(6),
  textAlign: 'center',
  backgroundColor: '#fff',  // Forced white background
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  border: `1px solid ${theme.palette.grey[200]}`,
}));

const AuthLink = styled((props) => (
  <Typography component="span" {...props} />
))(({ theme }) => ({
  color: theme.palette.primary.main,
  cursor: 'pointer',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.dark,
    textDecoration: 'underline',
  },
}));

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const body = JSON.stringify({ email, password });
      const res = await axios.post('http://localhost:5000/api/auth/login', body, config);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check credentials or approval status.');
    }
  };

  const handleSocialLogin = (provider) => {
    alert(`Initiating login with ${provider}... (Backend integration not yet implemented)`);
  };

  return (
    <AuthBox>
      <Typography variant="h3" component="h1" color="primary" sx={{ mb: 2, fontWeight: 700 }}>
        EventGuard
      </Typography>

      <Typography variant="h5" component="h2" sx={{ mb: 4, color: 'text.primary', fontWeight: 500 }}>
        Sign in to your account
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        <IconButton
          aria-label="Login with Google"
          onClick={() => handleSocialLogin('Google')}
          sx={{
            border: '1px solid #ccc',
            borderRadius: '50%',
            padding: '12px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderColor: (theme) => theme.palette.primary.main,
            }
          }}
        >
          <GoogleIcon sx={{ fontSize: 30, color: 'info.main' }} />
        </IconButton>
        <IconButton
          aria-label="Login with Facebook"
          onClick={() => handleSocialLogin('Facebook')}
          sx={{
            border: '1px solid #ccc',
            borderRadius: '50%',
            padding: '12px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderColor: (theme) => theme.palette.primary.main,
            }
          }}
        >
          <FacebookIcon sx={{ fontSize: 30, color: '#3b5998' }} />
        </IconButton>
      </Stack>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">OR</Typography>
      </Divider>

      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          margin="normal"
          id="email"
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={onChange}
          required
          variant="outlined"
          sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-border-medium)' } }}
        />
        <TextField
          fullWidth
          margin="normal"
          id="password"
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={onChange}
          required
          minLength={6}
          variant="outlined"
          sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-border-medium)' } }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
        >
          Sign In
        </Button>
      </form>

      {error && (
        <Typography
          color="error"
          sx={{
            mt: 2,
            mb: 2,
            p: 1,
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            bgcolor: 'error.lightest'
          }}
        >
          {error}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        <AuthLink onClick={() => alert('Forgot password logic...')} component="span">
          Forgot your password?
        </AuthLink>
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Don&apos;t have an account?{' '}
        <AuthLink onClick={() => navigate('/signup')} component="span">
          Sign up
        </AuthLink>
      </Typography>
    </AuthBox>
  );
};

export default Login;
