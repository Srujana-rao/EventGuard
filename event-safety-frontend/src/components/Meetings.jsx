import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import { socket } from '../socket';

const API_BASE_URL = 'http://localhost:5000/api';

const roleLabelMap = {
  all: 'All Staff',
  head: 'Head Staff',
  room: 'Room Staff',
  ground: 'Ground Staff',
};

export default function Meetings({ userRole }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState('');

  const isHead = userRole === 'head';

  useEffect(() => {
    let isMounted = true;

    const fetchMeetings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/meetings`);
        if (isMounted) {
          setMeetings(res.data || []);
        }
      } catch {
        if (isMounted) {
          setError('Failed to load meetings.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMeetings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleNewMeeting = (meeting) => {
      setMeetings((prev) => {
        if (prev.find((m) => m._id === meeting._id)) return prev;
        return [...prev, meeting].sort(
          (a, b) => new Date(a.meetingTime) - new Date(b.meetingTime)
        );
      });
    };

    const handleMeetingDeleted = (meetingId) => {
      setMeetings((prev) => prev.filter((m) => m._id !== meetingId));
    };

    socket.on('new-meeting', handleNewMeeting);
    socket.on('meeting-deleted', handleMeetingDeleted);

    return () => {
      socket.off('new-meeting', handleNewMeeting);
      socket.off('meeting-deleted', handleMeetingDeleted);
    };
  }, []);

  const handleDeleteMeeting = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/meetings/${id}`);
    } catch (err) {
      console.error('Failed to delete meeting', err);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess('');
    setCreating(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/meetings`, {
        title,
        description,
        targetRole,
        meetingTime,
        meetingLink,
      });

      // Immediately show the meeting for the head (don't wait only on socket)
      if (res.data) {
        setMeetings((prev) => {
          if (prev.find((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data].sort(
            (a, b) => new Date(a.meetingTime) - new Date(b.meetingTime)
          );
        });
      }

      setTitle('');
      setDescription('');
      setTargetRole('all');
      setMeetingTime('');
      setMeetingLink('');
      setCreateSuccess('Meeting scheduled successfully.');
      setTimeout(() => setCreateSuccess(''), 3000);
    } catch (err) {
      setCreateError(
        err.response?.data?.message || 'Failed to schedule meeting.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 4,
        alignItems: 'stretch',
      }}
    >
      {isHead && (
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight={700}>
            Schedule Meeting
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Create a meeting for all staff or a specific role.
          </Typography>

          {createSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {createSuccess}
            </Alert>
          )}
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleCreateMeeting} noValidate>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <FormControl variant="outlined" fullWidth margin="normal" required>
              <InputLabel id="target-role-label">Target Role</InputLabel>
              <Select
                labelId="target-role-label"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                label="Target Role"
              >
                <MenuItem value="all">All Staff</MenuItem>
                <MenuItem value="head">Head Staff</MenuItem>
                <MenuItem value="room">Room Staff</MenuItem>
                <MenuItem value="ground">Ground Staff</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Date & Time"
              type="datetime-local"
              variant="outlined"
              fullWidth
              margin="normal"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Meeting Link"
              variant="outlined"
              fullWidth
              margin="normal"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, py: 1.1, fontWeight: 600, textTransform: 'none' }}
              disabled={creating || !title || !targetRole || !meetingTime}
            >
              {creating ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </Box>
        </Paper>
      )}

      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Upcoming Meetings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          View scheduled meetings for your team.
        </Typography>

        {loading && (
          <Typography variant="body1" color="text.secondary">
            Loading meetings...
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && meetings.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No meetings scheduled yet.
          </Typography>
        )}
        {!loading && !error && meetings.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meetings.map((meeting) => (
              <Paper
                key={meeting._id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {meeting.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={roleLabelMap[meeting.targetRole] || meeting.targetRole}
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                {meeting.description && (
                  <Typography variant="body2" color="text.secondary">
                    {meeting.description}
                  </Typography>
                )}

                <Typography variant="body2">
                  <strong>Time:</strong>{' '}
                  {new Date(meeting.meetingTime).toLocaleString()}
                </Typography>

                {meeting.createdBy && (
                  <Typography variant="body2">
                    <strong>Created by:</strong> {meeting.createdBy}
                  </Typography>
                )}

                {meeting.meetingLink && (
                  <Typography variant="body2">
                    <strong>Join:</strong>{' '}
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667eea', fontWeight: 600 }}
                    >
                      Open meeting link
                    </a>
                  </Typography>
                )}

                {isHead && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      sx={{ textTransform: 'none' }}
                    >
                      Delete Meeting
                    </Button>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
