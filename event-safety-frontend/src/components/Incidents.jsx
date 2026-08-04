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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import { socket } from '../socket';

const API_BASE_URL = 'http://localhost:5000/api';

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

// Renders a small red dot under any calendar day that still has an
// unresolved incident, so the user can spot problem days at a glance.
function IncidentAwareDay(props) {
  const { unresolvedDates, day, outsideCurrentMonth, ...other } = props;
  const dateStr = day.format('YYYY-MM-DD');
  const hasUnresolved = !outsideCurrentMonth && unresolvedDates.includes(dateStr);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />
      {hasUnresolved && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#d32f2f',
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
}

export default function Incidents({ userRole }) {
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTeamByIncident, setSelectedTeamByIncident] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Independent "browse date" — defaults to today, but the user can pick any
  // date to look at past (or future) incidents without affecting the global
  // working date that Head controls on the Dashboard.
  const [viewDate, setViewDate] = useState(getTodayString());
  const [viewEventName, setViewEventName] = useState('');
  const [hasManualOverride, setHasManualOverride] = useState(false);

  // Dates (YYYY-MM-DD strings) that still have at least one unresolved incident
  const [unresolvedDates, setUnresolvedDates] = useState([]);

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

  const fetchIncidents = useCallback(async (date) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/incident-reports`, {
        headers: { 'x-auth-token': token },
        params: { date },
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

  const fetchEventNameForDate = useCallback(async (date) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/working-day/by-date`, {
        headers: { 'x-auth-token': token },
        params: { date },
      });
      setViewEventName(res.data?.eventName || '');
    } catch {
      setViewEventName('');
    }
  }, [token]);

  const fetchUnresolvedDates = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/incident-reports/unresolved-dates`, {
        headers: { 'x-auth-token': token },
      });
      setUnresolvedDates(res.data || []);
    } catch (err) {
      console.error('Error fetching unresolved dates:', err);
    }
  }, [token]);

  // On mount, follow whatever the current global working date is (until the
  // user manually changes the date picker on this page)
  useEffect(() => {
    if (hasManualOverride) return;
    axios
      .get(`${API_BASE_URL}/working-day/current`, { headers: { 'x-auth-token': token } })
      .then((res) => {
        if (res.data?.workingDate) {
          setViewDate(res.data.workingDate);
        }
      })
      .catch(() => {});
  }, [token, hasManualOverride]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchIncidents(viewDate),
      fetchTeams(),
      fetchEventNameForDate(viewDate),
      fetchUnresolvedDates(),
    ]).finally(() => setLoading(false));
  }, [viewDate, fetchIncidents, fetchTeams, fetchEventNameForDate, fetchUnresolvedDates]);

  // Keep following the global working date in real time, unless the user has
  // manually picked a different date to browse
  useEffect(() => {
    const handleWorkingDayChanged = (doc) => {
      if (!hasManualOverride && doc?.workingDate) {
        setViewDate(doc.workingDate);
      }
    };
    socket.on('working-day-changed', handleWorkingDayChanged);
    return () => socket.off('working-day-changed', handleWorkingDayChanged);
  }, [hasManualOverride]);

  const handleViewDateChange = (newDate) => {
    setHasManualOverride(true);
    setViewDate(newDate);
  };

  const handleResetToToday = async () => {
    setHasManualOverride(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/working-day/current`, {
        headers: { 'x-auth-token': token },
      });
      setViewDate(res.data?.workingDate || getTodayString());
    } catch {
      setViewDate(getTodayString());
    }
  };

  // Upsert instead of map-only: an incident assigned to you may never have
  // reached your list via the (head-only) creation event, so it needs to be
  // inserted the first time you hear about it, not just updated.
  const upsertIncident = useCallback((incident) => {
    // Only reflect it live if it belongs to the date currently being viewed
    if (incident.incidentDate !== viewDate) return;
    setIncidents((prev) => {
      const exists = prev.some((i) => i._id === incident._id);
      if (exists) {
        return prev.map((i) => (i._id === incident._id ? incident : i));
      }
      return [incident, ...prev];
    });
  }, [viewDate]);

  useEffect(() => {
    const handleCreated = (incident) => {
      upsertIncident(incident);
      fetchUnresolvedDates();
    };
    const handleUpdated = (incident) => {
      upsertIncident(incident);
      fetchUnresolvedDates();
    };
    const handleAssigned = (incident) => {
      upsertIncident(incident);
      fetchUnresolvedDates();
    };

    socket.on('incident-case-created', handleCreated);
    socket.on('incident-case-updated', handleUpdated);
    socket.on('incident-assigned', handleAssigned);

    return () => {
      socket.off('incident-case-created', handleCreated);
      socket.off('incident-case-updated', handleUpdated);
      socket.off('incident-assigned', handleAssigned);
    };
  }, [upsertIncident, fetchUnresolvedDates]);

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
      await fetchIncidents(viewDate);
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
      await fetchIncidents(viewDate);
      await fetchUnresolvedDates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update incident status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderActions = (incident) => {
    const team = incident.assignedTeam;

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

  const formattedViewDate = new Date(`${viewDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Paper elevation={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'flex-start' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            Incident Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isHead
              ? 'Review incidents generated from alerts and assign response teams.'
              : 'Track incidents assigned to your team and update their progress.'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <CalendarMonthIcon sx={{ color: '#667eea', display: { xs: 'none', sm: 'inline-flex' } }} />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="View Date"
              value={dayjs(viewDate)}
              onChange={(newValue) => {
                if (newValue && newValue.isValid()) {
                  handleViewDateChange(newValue.format('YYYY-MM-DD'));
                }
              }}
              slots={{ day: IncidentAwareDay }}
              slotProps={{
                day: { unresolvedDates },
                textField: {
                  size: 'small',
                  sx: { minWidth: { xs: '100%', sm: 170 }, flexGrow: { xs: 1, sm: 0 } },
                },
              }}
            />
          </LocalizationProvider>
          {hasManualOverride && (
            <Button size="small" onClick={handleResetToToday} sx={{ textTransform: 'none' }}>
              Back to Current
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Showing incidents for: <strong>{formattedViewDate}</strong>
        {viewEventName && <> — {viewEventName}</>}
        {unresolvedDates.length > 0 && (
          <>
            {' '}&nbsp;|&nbsp;
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d32f2f', display: 'inline-block' }} />
              Dates with unresolved incidents are marked on the calendar
            </Box>
          </>
        )}
      </Typography>

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
          No incidents reported for this date.
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