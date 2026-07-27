import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  Alert,
} from '@mui/material';
import { socket } from '../socket';

const API_BASE_URL = 'http://localhost:5000/api';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical':
      return 'error';
    case 'Medium':
      return 'warning';
    case 'Low':
    default:
      return 'success';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Open':
      return 'default';
    case 'Assigned':
      return 'info';
    case 'In Progress':
      return 'warning';
    case 'Resolved':
      return 'success';
    default:
      return 'default';
  }
};

export default function Incidents({ userRole }) {
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTeamByIncident, setSelectedTeamByIncident] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const token = localStorage.getItem('token');
  const isHead = userRole === 'head';

  const currentUserId = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.id || parsed?._id || null;
    } catch {
      return null;
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/incident-reports`, {
        headers: { 'x-auth-token': token },
      });
      setIncidents(res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load incidents.');
      console.error('Error fetching incidents:', err);
    }
  }, [token]);

  const fetchTeams = useCallback(async () => {
    if (!isHead) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/teams`, {
        headers: { 'x-auth-token': token },
      });
      setTeams(res.data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }, [token, isHead]);

  const fetchMyTeam = useCallback(async () => {
    if (isHead) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/teams/my-team`, {
        headers: { 'x-auth-token': token },
      });
      setMyTeam(res.data);
    } catch (err) {
      console.error('Error fetching my-team:', err);
    }
  }, [token, isHead]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchIncidents(), fetchTeams(), fetchMyTeam()]).finally(() => setLoading(false));
  }, [fetchIncidents, fetchTeams, fetchMyTeam]);

  useEffect(() => {
    const handleCreated = (incident) => {
      setIncidents((prev) => [incident, ...prev]);
    };
    const handleUpdated = (incident) => {
      setIncidents((prev) => prev.map((i) => (i._id === incident._id ? incident : i)));
    };
    const handleAssigned = (incident) => {
      setIncidents((prev) => prev.map((i) => (i._id === incident._id ? incident : i)));
    };

    socket.on('incident-case-created', handleCreated);
    socket.on('incident-case-updated', handleUpdated);
    socket.on('incident-assigned', handleAssigned);

    return () => {
      socket.off('incident-case-created', handleCreated);
      socket.off('incident-case-updated', handleUpdated);
      socket.off('incident-assigned', handleAssigned);
    };
  }, []);

  const handleAssign = async (incidentId) => {
    const teamId = selectedTeamByIncident[incidentId];
    if (!teamId) return;

    setActionLoadingId(incidentId);
    setError('');
    setSuccess('');
    try {
      await axios.patch(
        `${API_BASE_URL}/incident-reports/${incidentId}/assign`,
        { teamId },
        { headers: { 'x-auth-token': token } }
      );
      setSuccess('Team assigned successfully!');
      await fetchIncidents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign team.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (incidentId, status) => {
    setActionLoadingId(incidentId);
    setError('');
    setSuccess('');
    try {
      await axios.patch(
        `${API_BASE_URL}/incident-reports/${incidentId}/status`,
        { status },
        { headers: { 'x-auth-token': token } }
      );
      setSuccess(status === 'Resolved' ? 'Incident marked as resolved!' : 'Incident marked as In Progress!');
      await fetchIncidents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update incident status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderActions = (incident) => {
    const team = incident.assignedTeam;

    // Head: assign a team while Open
    if (isHead && incident.status === 'Open') {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={selectedTeamByIncident[incident._id] || ''}
              onChange={(e) =>
                setSelectedTeamByIncident((prev) => ({ ...prev, [incident._id]: e.target.value }))
              }
              displayEmpty
            >
              <MenuItem value="">
                <em>Select team</em>
              </MenuItem>
              {teams.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="contained"
            disabled={!selectedTeamByIncident[incident._id] || actionLoadingId === incident._id}
            onClick={() => handleAssign(incident._id)}
            sx={{ textTransform: 'none' }}
          >
            Assign
          </Button>
        </Box>
      );
    }

    if (!team) {
      return (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      );
    }

    const memberIds = (team.members || []).map((m) => String(m._id));
    const isTeamMember = currentUserId && memberIds.includes(String(currentUserId));
    const isTeamHead = team.teamHead && currentUserId && String(team.teamHead._id) === String(currentUserId);

    if (incident.status === 'Assigned' && (isTeamMember || isTeamHead)) {
      return (
        <Button
          size="small"
          variant="outlined"
          disabled={actionLoadingId === incident._id}
          onClick={() => handleStatusChange(incident._id, 'In Progress')}
          sx={{ textTransform: 'none' }}
        >
          Start Work
        </Button>
      );
    }

    if (incident.status === 'In Progress' && isTeamHead) {
      return (
        <Button
          size="small"
          variant="contained"
          color="success"
          disabled={actionLoadingId === incident._id}
          onClick={() => handleStatusChange(incident._id, 'Resolved')}
          sx={{ textTransform: 'none' }}
        >
          Mark Resolved
        </Button>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  };

  return (
    <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Incident Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isHead
            ? 'Review incidents generated from alerts and assign response teams.'
            : 'Track incidents assigned to your team and update their progress.'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading incidents...</Typography>
      ) : incidents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No incidents reported yet.
        </Typography>
      ) : (
        <TableContainer sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell><strong>Incident ID</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Priority</strong></TableCell>
                <TableCell><strong>Assigned Team</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident._id} hover>
                  <TableCell>{incident.incidentId}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                  <TableCell>{incident.location || '—'}</TableCell>
                  <TableCell>
                    <Chip label={incident.priority} color={getPriorityColor(incident.priority)} size="small" />
                  </TableCell>
                  <TableCell>{incident.assignedTeam?.name || '—'}</TableCell>
                  <TableCell>
                    <Chip label={incident.status} color={getStatusColor(incident.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">{renderActions(incident)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}