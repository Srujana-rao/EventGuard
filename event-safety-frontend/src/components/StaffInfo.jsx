import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Chip } from '@mui/material';

const API_BASE_URL = 'http://localhost:5000/api';

export default function StaffInfo() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`);
        if (isMounted) {
          setUsers(res.data || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load staff information.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const headStaff = users.filter((u) => u.role === 'head');
  const roomStaff = users.filter((u) => u.role === 'room');
  const groundStaff = users.filter((u) => u.role === 'ground');

  const renderSection = (title, staffList) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {staffList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No staff in this group yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {staffList.map((member) => (
            <Box
              key={member.username}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Chip label={member.username} color="primary" variant="outlined" />
              <Chip
                label={member.status === 'online' ? 'Online' : 'Offline'}
                color={member.status === 'online' ? 'success' : 'default'}
                variant={member.status === 'online' ? 'filled' : 'outlined'}
                size="small"
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: member.status === 'online' ? 'success.main' : 'grey.500',
                    }}
                  />
                }
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Staff Overview
      </Typography>

      {loading && (
        <Typography variant="body1" color="text.secondary">
          Loading staff information...
        </Typography>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          {renderSection('Head Staff', headStaff)}
          {renderSection('Room Staff', roomStaff)}
          {renderSection('Ground Staff', groundStaff)}
        </>
      )}
    </Paper>
  );
}

