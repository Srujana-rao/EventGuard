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

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { username, email, password, password2 } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== password2) {
      setError('Passwords do not match');
      return;
    } else {
      setError(null);
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const body = JSON.stringify({ username, email, password });
      const res = await axios.post('http://localhost:5000/api/auth/signup', body, config);
      setMessage(res.data.msg || 'Registration successful! Awaiting head approval.');
      setError(null);
      navigate('/login'); // Navigate to login after successful signup
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setMessage('');
      setError(err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Registration failed. Please try again.');
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      }
    }
  };

  const handleSocialLogin = (provider) => {
    alert(`Initiating signup with ${provider}... (Not yet implemented)`);
  };

  return (
    <AuthBox>
      <Typography variant="h3" component="h1" color="primary" sx={{ mb: 2, fontWeight: 700 }}>
        EventGuard
      </Typography>

      <Typography variant="h5" component="h2" sx={{ mb: 4, color: 'text.primary', fontWeight: 500 }}>
        Create your account
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
<IconButton
          aria-label="Login with Google"
          onClick={() => handleSocialLogin('Google')}
          sx={{
            border: '1px solid #ccc',
            borderRadius: '50%',
            padding: '12px',
            backgroundColor: '#fff',
            transition: 'border-color 0.2s, background 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderColor: (theme) => theme.palette.primary.main,
            },
          }}
        >
          <img
            src="src/assets/google-logo.svg" // Replace with your actual image path
            alt="Google"
            style={{ width: 30, height: 30, display: 'block', margin: 'auto' }}
          />
        </IconButton>
        <IconButton
          aria-label="Signup with Facebook"
          onClick={() => handleSocialLogin('Facebook')}
          sx={{
            border: '1px solid #ccc',
            borderRadius: '50%',
            padding: '12px',
            backgroundColor: '#fff',
            transition: 'border-color 0.2s, background 0.2s',
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
          id="username"
          label="Username"
          name="username"
          type="text"
          value={username}
          onChange={onChange}
          required
          variant="standard"
          InputLabelProps={{ shrink: true }}
          placeholder="Username"
          sx={{
            '& .MuiInput-underline:before': {
              borderBottomColor: 'var(--color-border-medium)',
              transition: 'border-bottom-color 0.3s',
            },
            '&:hover .MuiInput-underline:before': {
              borderBottomColor: (theme) => theme.palette.primary.light,
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: (theme) => theme.palette.primary.main,
              borderBottomWidth: 2,
            },
          }}
        />
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
          variant="standard"
          InputLabelProps={{ shrink: true }}
          placeholder="Email"
          sx={{
            '& .MuiInput-underline:before': {
              borderBottomColor: 'var(--color-border-medium)',
              transition: 'border-bottom-color 0.3s',
            },
            '&:hover .MuiInput-underline:before': {
              borderBottomColor: (theme) => theme.palette.primary.light,
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: (theme) => theme.palette.primary.main,
              borderBottomWidth: 2,
            },
          }}
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
          variant="standard"
          InputLabelProps={{ shrink: true }}
          placeholder="Password"
          sx={{
            '& .MuiInput-underline:before': {
              borderBottomColor: 'var(--color-border-medium)',
              transition: 'border-bottom-color 0.3s',
            },
            '&:hover .MuiInput-underline:before': {
              borderBottomColor: (theme) => theme.palette.primary.light,
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: (theme) => theme.palette.primary.main,
              borderBottomWidth: 2,
            },
          }}
        />
        <TextField
          fullWidth
          margin="normal"
          id="password2"
          label="Confirm Password"
          name="password2"
          type="password"
          value={password2}
          onChange={onChange}
          required
          minLength={6}
          variant="standard"
          InputLabelProps={{ shrink: true }}
          placeholder="Confirm Password"
          sx={{
            '& .MuiInput-underline:before': {
              borderBottomColor: 'var(--color-border-medium)',
              transition: 'border-bottom-color 0.3s',
            },
            '&:hover .MuiInput-underline:before': {
              borderBottomColor: (theme) => theme.palette.primary.light,
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: (theme) => theme.palette.primary.main,
              borderBottomWidth: 2,
            },
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
        >
          Register
        </Button>
      </form>

      {message && (
        <Typography
          color="secondary"
          sx={{
            mt: 2,
            mb: 2,
            p: 1,
            border: '1px solid',
            borderColor: 'secondary.main',
            borderRadius: 1,
            bgcolor: 'secondary.lightest',
          }}
        >
          {message}
        </Typography>
      )}

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
            bgcolor: 'error.lightest',
          }}
        >
          {error}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Already have an account?{' '}
        <AuthLink onClick={() => navigate('/login')} component="span">
          Login
        </AuthLink>
      </Typography>
    </AuthBox>
  );
};

export default Signup;
