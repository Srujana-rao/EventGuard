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
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { socket } from '../socket';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const roleLabel = (role) => {
  if (role === 'head') return 'Head';
  if (role === 'room') return 'Room';
  if (role === 'ground') return 'Ground';
  return role || '—';
};

const HeadDashboard = ({ userRole }) => {
  const [tab, setTab] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [roleChangeRequests, setRoleChangeRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const authConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return { headers: { 'x-auth-token': token } };
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = authConfig();
      const [usersRes, roleRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/pending-users`, config),
        axios.get(`${API_BASE_URL}/auth/pending-role-changes`, config),
      ]);

      setPendingUsers(usersRes.data || []);
      setRoleChangeRequests(roleRes.data || []);

      const initialRoles = {};
      (usersRes.data || []).forEach((user) => {
        initialRoles[user._id] = user.role;
      });
      setSelectedRole(initialRoles);
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setMessage('');
    setError(null);
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const config = {
        ...authConfig(),
        headers: { ...authConfig().headers, 'Content-Type': 'application/json' },
      };
      const res = await axios.post(
        `${API_BASE_URL}/auth/approve-user/${userId}`,
        { role: selectedRole[userId] },
        config
      );
      setMessage(res.data.msg);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to approve user');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleApproveRoleChange = async (userId) => {
    setMessage('');
    setError(null);
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const config = authConfig();
      const res = await axios.post(
        `${API_BASE_URL}/auth/approve-role-change/${userId}`,
        {},
        config
      );
      setMessage(res.data.msg);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to approve role change');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleRejectRoleChange = async (userId) => {
    setMessage('');
    setError(null);
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const config = authConfig();
      const res = await axios.post(
        `${API_BASE_URL}/auth/reject-role-change/${userId}`,
        {},
        config
      );
      setMessage(res.data.msg);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reject role change');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (userRole === 'head') fetchAll();
    else {
      setError('Access Denied: You must be a team head to view this dashboard.');
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    const handleApprovalRequested = () => {
      fetchAll();
    };

    socket.on('pending-summary-update', handleApprovalRequested);

    return () => {
      socket.off('pending-summary-update', handleApprovalRequested);
    };
  }, []);

  if (loading && !error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading User Approvals...
        </Typography>
      </Box>
    );
  }

  if (error && userRole !== 'head') {
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
    <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, maxWidth: 960, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        User Approvals
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review new registrations and role change requests from Ground and Room staff.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_e, next) => setTab(next)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Pending Approvals
              {pendingUsers.length > 0 && (
                <Chip size="small" color="error" label={pendingUsers.length} />
              )}
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Role Change Approvals
              {roleChangeRequests.length > 0 && (
                <Chip size="small" color="error" label={roleChangeRequests.length} />
              )}
            </Box>
          }
        />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Pending Approvals ({pendingUsers.length})
          </Typography>

          {pendingUsers.length === 0 ? (
            <Typography color="text.secondary">No pending users to approve.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingUsers.map((user) => (
                <Paper
                  key={user._id}
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
                >
                  <Box>
                    <Typography>
                      <strong>Username:</strong> {user.username}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {user.email}
                    </Typography>
                    <Typography>
                      <strong>Registered:</strong>{' '}
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                    </Typography>
                    <Typography>
                      <strong>Current Role:</strong> {roleLabel(user.role)} (Default)
                    </Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel id={`role-select-label-${user._id}`}>Assign Role</InputLabel>
                    <Select
                      labelId={`role-select-label-${user._id}`}
                      value={selectedRole[user._id] || user.role}
                      label="Assign Role"
                      onChange={(e) =>
                        setSelectedRole((prev) => ({ ...prev, [user._id]: e.target.value }))
                      }
                    >
                      <MenuItem value="ground">Ground Member</MenuItem>
                      <MenuItem value="room">Security Room</MenuItem>
                      <MenuItem value="head">Team Head</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleApproveUser(user._id)}
                    disabled={!!actionLoading[user._id]}
                  >
                    {actionLoading[user._id] ? 'Approving...' : 'Approve & Set Role'}
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Role Change Approvals ({roleChangeRequests.length})
          </Typography>

          {roleChangeRequests.length === 0 ? (
            <Typography color="text.secondary">No role change requests pending.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {roleChangeRequests.map((user) => (
                <Paper
                  key={user._id}
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
                >
                  <Box>
                    <Typography>
                      <strong>User Name:</strong> {user.username}
                    </Typography>
                    <Typography>
                      <strong>Current Role:</strong> {roleLabel(user.role)}
                    </Typography>
                    <Typography>
                      <strong>Requested Role:</strong> {roleLabel(user.pendingRole)}
                    </Typography>
                    <Typography>
                      <strong>Request Date:</strong>{' '}
                      {user.updatedAt
                        ? new Date(user.updatedAt).toLocaleString()
                        : user.createdAt
                          ? new Date(user.createdAt).toLocaleString()
                          : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleApproveRoleChange(user._id)}
                      disabled={!!actionLoading[user._id]}
                    >
                      {actionLoading[user._id] ? 'Working...' : 'Approve'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRejectRoleChange(user._id)}
                      disabled={!!actionLoading[user._id]}
                    >
                      Reject
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default HeadDashboard;
