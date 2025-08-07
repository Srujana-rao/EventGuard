import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const HeadDashboard = ({ userRole }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState({});

  const API_BASE_URL = 'http://localhost:5000/api';

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get(`${API_BASE_URL}/auth/pending-users`, config);
      setPendingUsers(res.data);
      const initialRoles = {};
      res.data.forEach(user => {
        initialRoles[user._id] = user.role;
      });
      setSelectedRole(initialRoles);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending users');
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setMessage('');
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
      };
      const body = { role: selectedRole[userId] };
      const res = await axios.post(`${API_BASE_URL}/auth/approve-user/${userId}`, body, config);
      setMessage(res.data.msg);
      fetchPendingUsers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to approve user');
    }
  };

  useEffect(() => {
    if (userRole === 'head') fetchPendingUsers();
    else {
      setError('Access Denied: You must be a team head to view this dashboard.');
      setLoading(false);
    }
  }, [userRole]);

  if (loading && !error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading Head Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (userRole !== 'head') {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Access Denied: You must be a team head to view this page.
      </Alert>
    );
  }

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Team Head User Approval
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Pending Approvals ({pendingUsers.length})
      </Typography>

      {pendingUsers.length === 0 ? (
        <Typography>No pending users to approve.</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
          {pendingUsers.map((user) => (
            <Paper
              key={user._id}
              variant="outlined"
              sx={{ mb: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
              aria-label={`Pending approval for user ${user.username}`}
            >
              <Box sx={{ mb: 1 }}>
                <Typography><strong>Username:</strong> {user.username}</Typography>
                <Typography><strong>Email:</strong> {user.email}</Typography>
                <Typography><strong>Registered:</strong> {new Date(user.createdAt).toLocaleString()}</Typography>
                <Typography><strong>Current Role:</strong> {user.role} (Default)</Typography>
              </Box>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id={`role-select-label-${user._id}`}>Assign Role</InputLabel>
                <Select
                  labelId={`role-select-label-${user._id}`}
                  id={`role-select-${user._id}`}
                  value={selectedRole[user._id] || user.role}
                  label="Assign Role"
                  onChange={e => setSelectedRole(prev => ({ ...prev, [user._id]: e.target.value }))}
                  aria-describedby={`assign-role-description-${user._id}`}
                >
                  <MenuItem value="ground">Ground Member</MenuItem>
                  <MenuItem value="room">Security Room</MenuItem>
                  <MenuItem value="head">Team Head</MenuItem>
                </Select>
                <Typography id={`assign-role-description-${user._id}`} variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Select a role before approval
                </Typography>
              </FormControl>
              <Button variant="contained" color="primary" onClick={() => handleApproveUser(user._id)} aria-label={`Approve user ${user.username} and set role`}>
                Approve & Set Role
              </Button>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default HeadDashboard;
