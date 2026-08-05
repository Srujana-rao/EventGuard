import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Chip, TextField, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { socket } from '../socket';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function StaffInfo() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/users`);
      setUsers(res.data || []);
      setError(null);
    } catch {
      setError('Failed to load staff information.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(true);

    // Refresh when someone logs in/out via socket presence
    const handlePresenceUpdated = () => {
      fetchUsers(false);
    };
    socket.on('presence-updated', handlePresenceUpdated);

    // Light polling as a fallback if a socket event is missed
    const intervalId = setInterval(() => {
      fetchUsers(false);
    }, 8000);

    return () => {
      socket.off('presence-updated', handlePresenceUpdated);
      clearInterval(intervalId);
    };
  }, [fetchUsers]);

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

  const columnsByRole = {
    head: { key: 'head', title: 'Head Staff', staffList: headStaff },
    room: { key: 'room', title: 'Room Staff', staffList: roomStaff },
    ground: { key: 'ground', title: 'Ground Staff', staffList: groundStaff },
  };

  const columnsToShow =
    roleFilter === 'all'
      ? [columnsByRole.head, columnsByRole.room, columnsByRole.ground]
      : [columnsByRole[roleFilter]];

  const renderColumn = (title, staffList) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
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
    <Paper elevation={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
        Staff Overview
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              size="small"
              variant={roleFilter === opt.value ? 'contained' : 'outlined'}
              onClick={() => setRoleFilter(opt.value)}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
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
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: roleFilter === 'all' ? '1fr 1fr 1fr' : '1fr',
            },
            gap: { xs: 3, md: 4 },
          }}
        >
          {columnsToShow.map((col) => (
            <React.Fragment key={col.key}>
              {renderColumn(col.title, col.staffList)}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Paper>
  );
}