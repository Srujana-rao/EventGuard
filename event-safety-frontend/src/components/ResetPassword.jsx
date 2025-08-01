// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const { token } = useParams(); // token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error resetting password');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" align="center" mb={3}>Reset Password</Typography>
      {message && <Typography color="success.main" mb={2}>{message}</Typography>}
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="New Password"
          variant="outlined"
          fullWidth
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Confirm New Password"
          variant="outlined"
          fullWidth
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" color="primary" fullWidth type="submit" sx={{ mt: 2 }}>
          Reset Password
        </Button>
      </form>
    </Box>
  );
}
