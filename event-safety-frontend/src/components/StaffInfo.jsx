import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Chip, TextField, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const API_BASE_URL = 'http://localhost:5000/api';

export default function StaffInfo() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesSearch = u.username.toLowerCase().includes(search.trim().toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const headStaff = filteredUsers.filter((u) => u.role === 'head');
  const roomStaff = filteredUsers.filter((u) => u.role === 'room');
  const groundStaff = filteredUsers.filter((u) => u.role === 'ground');

  const renderColumn = (title, staffList) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {staffList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No staff found.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {staffList.map((member) => (
            <Box
              key={member.username}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
            >
              <Chip label={member.username} color="primary" variant="outlined" />
              <Chip
                label={member.status === 'online' ? 'Online' : 'Offline'}
                color={member.status === 'online' ? 'success' : 'default'}
                variant={member.status === 'online' ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Head', value: 'head' },
    { label: 'Room', value: 'room' },
    { label: 'Ground', value: 'ground' },
  ];

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Staff Overview
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              size="small"
              variant={roleFilter === opt.value ? 'contained' : 'outlined'}
              onClick={() => setRoleFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </Box>
        <TextField
          size="small"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
      </Box>

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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
          {renderColumn('Head Staff', headStaff)}
          {renderColumn('Room Staff', roomStaff)}
          {renderColumn('Ground Staff', groundStaff)}
        </Box>
      )}
    </Paper>
  );
}