// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage('If the email exists, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error sending reset email');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" align="center" mb={3}>Forgot Password</Typography>
      {message && <Typography color="success.main" mb={2}>{message}</Typography>}
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email Address"
          variant="outlined"
          fullWidth
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" color="primary" fullWidth type="submit" sx={{ mt: 2 }}>
          Send Reset Link
        </Button>
      </form>
    </Box>
  );
}
