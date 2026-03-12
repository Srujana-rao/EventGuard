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
  List,
  Card,
  CardContent,
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
      } catch (err) {
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
    setCreating(true);

    try {
      await axios.post(`${API_BASE_URL}/meetings`, {
        title,
        description,
        targetRole,
        meetingTime,
        meetingLink,
      });

      setTitle('');
      setDescription('');
      setTargetRole('all');
      setMeetingTime('');
      setMeetingLink('');
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
        gridTemplateColumns: { xs: '1fr', md: isHead ? '1fr 1.2fr' : '1fr' },
        gap: 3,
      }}
    >
        {isHead && (
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography variant="h5" gutterBottom fontWeight={700}>
              Schedule Meeting
            </Typography>
            <Box component="form" onSubmit={handleCreateMeeting} noValidate>
              <TextField
                label="Title"
                variant="standard"
                fullWidth
                margin="normal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <TextField
                label="Description"
                variant="standard"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <FormControl
                variant="standard"
                fullWidth
                margin="normal"
                required
              >
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
                variant="standard"
                fullWidth
                margin="normal"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
              <TextField
                label="Meeting Link (optional)"
                variant="standard"
                fullWidth
                margin="normal"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
              {createError && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 1 }}
                >
                  {createError}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
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
            p: 3,
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight={700}>
            Upcoming Meetings
          </Typography>
          {loading && (
            <Typography variant="body1" color="text.secondary">
              Loading meetings...
            </Typography>
          )}
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          {!loading && !error && meetings.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No meetings scheduled yet.
            </Typography>
          )}
          {!loading && !error && meetings.length > 0 && (
            <List sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {meetings.map((meeting) => (
                <Card key={meeting._id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      {meeting.title}
                    </Typography>
                    {meeting.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {meeting.description}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>For:</strong>{' '}
                      {roleLabelMap[meeting.targetRole] || meeting.targetRole}
                    </Typography>
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
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>Join:</strong>{' '}
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open meeting link
                        </a>
                      </Typography>
                    )}
                    {isHead && (
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteMeeting(meeting._id)}
                        >
                          Delete Meeting
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Paper>
    </Box>
  );
}

