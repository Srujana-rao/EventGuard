import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  Alert as MuiAlert,
  IconButton,
  Avatar,
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SidebarMenu from './SidebarMenu';
import { socket } from '../socket';

const topBarBg = '#ffffff';
const topBarTextColor = '#333';
const sidebarWidth = 220;
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function WorkingDayPanel({ userRole, workingDate, workingEventName, workingDayLoaded, saveWorkingDay }) {
  const isHead = userRole === 'head';
  const [draftDate, setDraftDate] = useState(workingDate);
  const [draftEventName, setDraftEventName] = useState(workingEventName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setDraftDate(workingDate);
    setDraftEventName(workingEventName);
  }, [workingDate, workingEventName]);

  const formattedDate = workingDate
    ? new Date(`${workingDate}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const handleSave = async () => {
    if (!draftDate) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await saveWorkingDay(draftDate, draftEventName);
      setSaveSuccess('Working date updated.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update working date.');
    } finally {
      setSaving(false);
    }
  };

  if (!workingDayLoaded) {
    return null;
  }

  if (!isHead) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <CalendarMonthIcon sx={{ color: '#667eea' }} />
        <Typography variant="body2" sx={{ color: '#333' }}>
          Working Date: <strong>{formattedDate}</strong>
          {workingEventName && (
            <>
              {' '}&nbsp;|&nbsp; Event: <strong>{workingEventName}</strong>
            </>
          )}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <CalendarMonthIcon sx={{ color: '#667eea' }} />
        <TextField
          label="Working Date"
          type="date"
          size="small"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: { xs: '100%', sm: 180 } }}
        />
        <TextField
          label="Event Name"
          size="small"
          value={draftEventName}
          onChange={(e) => setDraftEventName(e.target.value)}
          placeholder="e.g. Summer Fest 2026"
          sx={{ minWidth: { xs: '100%', sm: 220 }, flexGrow: { xs: 1, sm: 0 } }}
        />
        <Button
          variant="contained"
          size="small"
          disabled={!draftDate || saving}
          onClick={handleSave}
          sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      {saveError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {saveError}
        </Typography>
      )}
      {saveSuccess && (
        <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
          {saveSuccess}
        </Typography>
      )}
    </Paper>
  );
}

const AlertsTab = ({
  alertMessage,
  setAlertMessage,
  alertMediaFile,
  setAlertMediaFile,
  alertTargetRole,
  setAlertTargetRole,
  alertPriority,
  setAlertPriority,
  alertLocationTag,
  setAlertLocationTag,
  handleSendAlert,
  realtimeAlerts,
  alertSendError,
  alertSendSuccess,
  alertMediaInputRef,
}) => {
  const isSendAlertDisabled =
    !alertMessage.trim() ||
    !alertTargetRole ||
    !alertPriority;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'success';
      case 'critical':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 3, md: 4 }, alignItems: 'stretch' }}>
      <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, overflow: 'hidden' }}> 
        <Typography variant="h5" gutterBottom fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Send Alert
        </Typography>
        <Box component="form" onSubmit={handleSendAlert} noValidate>
          <TextField
            variant="outlined"
            fullWidth
            placeholder="Enter alert message"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            name="alert-message-field"
            autoComplete="off"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
              },
              '& .MuiOutlinedInput-input': {
                pl: 2,
                pr: 8.8,
                py: 1.25,
              },
            }}
            required
            inputProps={{ 'aria-label': 'Alert message' }}
          />
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Quick Emergency
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAlertMessage("Fire reported");
                  setAlertPriority("critical");
                }}
              >
                Fire
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAlertMessage("Medical Emergency");
                  setAlertPriority("critical");
                }}
              >
                Medical
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAlertMessage("Security Issue");
                  setAlertPriority("critical");
                }}
              >
                Security
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setAlertMessage("Lost Person")}
              >
                Lost Person
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setAlertMessage("Crowd Congestion")}
              >
                Crowd
              </Button>
            </Box>
          </Box>
          {alertMediaFile && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Selected media:</Typography>
              {alertMediaFile.type.startsWith('image') && (
                <img
                  src={URL.createObjectURL(alertMediaFile)}
                  alt="Selected alert media"
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                />
              )}
              {alertMediaFile.type.startsWith('video') && (
                <video
                  src={URL.createObjectURL(alertMediaFile)}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                />
              )}
              {alertMediaFile.type.startsWith('audio') && (
                <audio controls src={URL.createObjectURL(alertMediaFile)} />
              )}
            </Box>
          )}
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Add Media
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label">
                Capture Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      setAlertMediaFile(e.target.files[0]);
                    }
                  }}
                />
              </Button>

              <Button variant="outlined" component="label">
                Upload
                <input
                  hidden
                  type="file"
                  accept="image/*,video/*,audio/*"
                  ref={alertMediaInputRef}
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      setAlertMediaFile(e.target.files[0]);
                    } else {
                      setAlertMediaFile(null);
                    } 
                  }}
                />
              </Button>
            </Box>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Send To
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: 'wrap' }}>
              {["all", "head", "room", "ground"].map((role) => (
                <Button
                  key={role}
                  variant={alertTargetRole === role ? "contained" : "outlined"}
                  onClick={() => setAlertTargetRole(role)}
                  size="small"
                  sx={{ flexGrow: { xs: 1, sm: 0 } }}
                >
                  {role.toUpperCase()}
                </Button>
              ))}
            </Box>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Priority
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={alertPriority === "low" ? "contained" : "outlined"}
                color="success"
                onClick={() => setAlertPriority("low")}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Low
              </Button>

              <Button
                variant={alertPriority === "medium" ? "contained" : "outlined"}
                color="warning"
                onClick={() => setAlertPriority("medium")}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Medium
              </Button>

              <Button
                variant={alertPriority === "critical" ? "contained" : "outlined"}
                color="error"
                onClick={() => setAlertPriority("critical")}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Critical
              </Button>
            </Box>
          </Box>
          <TextField
            variant="outlined"
            required
            fullWidth
            placeholder="Enter location"
            value={alertLocationTag}
            onChange={(e) => setAlertLocationTag(e.target.value)}
            name="alert-location-field"
            autoComplete="off"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-input': {
                pl: 2,
                pr: 8.8,
                py: 1.25,
              },
            }}
            aria-label="Location tag"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            fullWidth
            disabled={isSendAlertDisabled}
            sx={{ py: 1.8 }}
            aria-disabled={isSendAlertDisabled}
            aria-label="Send alert"
          >
            Send Alert
          </Button>
          {alertSendSuccess && (
            <Typography variant="body2" color="success.main" mt={2} fontWeight={600} role="alert">
              {alertSendSuccess}
            </Typography>
          )}
          {alertSendError && (
            <Typography variant="body2" color="error" mt={2} fontWeight={600} role="alert">
              {alertSendError}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, overflowY: 'auto' }}>
        <Typography variant="h5" gutterBottom fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Real-time Alerts Feed
        </Typography>
        {realtimeAlerts.length === 0 ? (
          <Typography>No real-time alerts yet.</Typography>
        ) : (
          <Box component="ul" sx={{ padding: 0, listStyle: 'none' }}>
            {realtimeAlerts.map((alert, index) => (
              <Box
                component="li"
                key={index}
                sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
              >
                <Typography flexGrow={1}>
                  <strong>ALERT:</strong> {alert.message}
                  <br />

                  {alert.locationTag && (
                    <>
                      <strong>LOCATION:</strong> {alert.locationTag}
                      <br />
                    </>
                  )}

                  <strong>FROM:</strong> {alert.sender} ({alert.senderRole})
                  <br />

                  <strong>TIME:</strong> {new Date(alert.timestamp).toLocaleTimeString()}
                </Typography>
                <Chip
                  label={alert.priority?.toUpperCase()}
                  color={getPriorityColor(alert.priority)}
                  size="small"
                  aria-label={`Priority: ${alert.priority}`}
                />
                {alert.mediaUrl && (
                  <Box mt={1} sx={{ width: '100%' }}>
                    {alert.mediaType === 'image' && (
                      <img
                        src={alert.mediaUrl}
                        alt="Alert Media"
                        style={{ width: '100%', borderRadius: 4 }}
                      />
                    )}
                    {alert.mediaType === 'video' && (
                      <video controls src={alert.mediaUrl} style={{ width: '100%', borderRadius: 4 }} />
                    )}
                    {alert.mediaType === 'audio' && <audio controls src={alert.mediaUrl} />}
                    <Typography mt={1}>
                      <a href={alert.mediaUrl} target="_blank" rel="noopener noreferrer">
                        View Media
                      </a>
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default function Dashboard({
  username,
  userRole,
  handleLogout,
  alertMessage,
  setAlertMessage,
  alertMediaFile,
  setAlertMediaFile,
  alertSendError,
  alertSendSuccess,
  alertTargetRole,
  setAlertTargetRole,
  alertPriority,
  setAlertPriority,
  alertLocationTag,
  setAlertLocationTag,
  handleSendAlert,
  realtimeAlerts,
  alertMediaInputRef,
  approvalsPending = 0,
  meetingNotificationCount = 0,
  workingDate,
  workingEventName,
  workingDayLoaded,
  saveWorkingDay,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  const [incidentsPending, setIncidentsPending] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    function handleKeyUp(e) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    axios
      .get(`${API_BASE_URL}/teams/my-team`, { headers: { 'x-auth-token': token } })
      .then((res) => {
        if (isMounted) setMyTeam(res.data);
      })
      .catch(() => {
        // non-critical
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const refreshIncidentSummary = () => {
      axios
        .get(`${API_BASE_URL}/incident-reports/summary`, { headers: { 'x-auth-token': token } })
        .then((res) => {
          if (isMounted) setIncidentsPending(res.data?.pending || 0);
        })
        .catch(() => {});
    };

    refreshIncidentSummary();

    window.addEventListener('focus', refreshIncidentSummary);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', refreshIncidentSummary);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const refreshChatUnread = () => {
      axios
        .get(`${API_BASE_URL}/chat/unread-summary`, { headers: { 'x-auth-token': token } })
        .then((res) => {
          if (isMounted) setChatUnread(res.data?.total || 0);
        })
        .catch(() => {});
    };

    refreshChatUnread();

    const handleChatUnreadUpdate = () => refreshChatUnread();
    const handleChatBadgeRefresh = () => refreshChatUnread();

    socket.on('chat-unread-update', handleChatUnreadUpdate);
    socket.on('receive-chat-message', handleChatUnreadUpdate);
    window.addEventListener('chat-badge-refresh', handleChatBadgeRefresh);
    window.addEventListener('focus', refreshChatUnread);

    return () => {
      isMounted = false;
      socket.off('chat-unread-update', handleChatUnreadUpdate);
      socket.off('receive-chat-message', handleChatUnreadUpdate);
      window.removeEventListener('chat-badge-refresh', handleChatBadgeRefresh);
      window.removeEventListener('focus', refreshChatUnread);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: '#f0f2f5',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <SidebarMenu
        userRole={userRole}
        approvalsPending={approvalsPending}
        meetingsPending={meetingNotificationCount}
        incidentsPending={incidentsPending}
        chatUnread={chatUnread}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        onLogout={handleLogout}
      />

      {/* Mobile app bar — only visible below md */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          bgcolor: topBarBg,
          color: topBarTextColor,
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          px: 2,
          zIndex: 1400,
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          edge="start"
          onClick={handleDrawerToggle}
          aria-label="Open sidebar menu"
          sx={{ color: '#667eea' }}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SecurityIcon sx={{ fontSize: 20, color: '#667eea' }} />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EventGuard
          </Typography>
        </Box>
        <Box sx={{ width: 40 }} />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          ml: { md: `${sidebarWidth}px` },
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
        }}
      >
        {/* Desktop/user-info bar — logo only shows on md+, since mobile app bar above already has it */}
        <Box
          sx={{
            width: '100%',
            minHeight: { xs: 'auto', md: 72 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: { xs: 'flex-start', md: 'space-between' },
            bgcolor: topBarBg,
            color: topBarTextColor,
            px: { xs: 2, md: 2.5 },
            py: { xs: 1.5, md: 0 },
            position: 'fixed',
            top: { xs: 56, md: 0 },
            left: 0,
            right: 0,
            zIndex: 1350,
            boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <SecurityIcon sx={{ fontSize: { md: 34, lg: 44 }, color: '#667eea' }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.4,
                fontSize: { md: '1.3rem', lg: '1.5rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EventGuard
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'space-between', md: 'flex-end' },
              gap: 1.5,
              width: { xs: '100%', md: 'auto' },
            }}
          >
            <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#667eea',
                  lineHeight: 1.25,
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' },
                }}
                aria-live="polite"
              >
                Welcome, {username} ({userRole.charAt(0).toUpperCase() + userRole.slice(1)})
              </Typography>
              {myTeam && (
                <Typography
                  sx={{
                    color: '#667eea',
                    fontWeight: 700,
                    fontSize: { xs: '0.72rem', sm: '0.8rem' },
                    display: 'block',
                  }}
                >
                  Team: {myTeam.name}
                </Typography>
              )}
            </Box>
            <Avatar
              src={localStorage.getItem('profileAvatar') || undefined}
              sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#667eea', flexShrink: 0 }}
            >
              {username ? username[0]?.toUpperCase() : ''}
            </Avatar>
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1400,
            mx: 'auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: 'background.default',
            mt: { xs: '116px', sm: '108px', md: '72px' },
            minHeight: { xs: 'calc(100vh - 116px)', md: 'calc(100vh - 72px)' },
          }}
          role="main"
        >
          <WorkingDayPanel
            userRole={userRole}
            workingDate={workingDate}
            workingEventName={workingEventName}
            workingDayLoaded={workingDayLoaded}
            saveWorkingDay={saveWorkingDay}
          />

          <AlertsTab
            alertMessage={alertMessage}
            setAlertMessage={setAlertMessage}
            alertMediaFile={alertMediaFile}
            setAlertMediaFile={setAlertMediaFile}
            alertTargetRole={alertTargetRole}
            setAlertTargetRole={setAlertTargetRole}
            alertPriority={alertPriority}
            setAlertPriority={setAlertPriority}
            alertLocationTag={alertLocationTag}
            setAlertLocationTag={setAlertLocationTag}
            handleSendAlert={handleSendAlert}
            realtimeAlerts={realtimeAlerts}
            alertSendError={alertSendError}
            alertSendSuccess={alertSendSuccess}
            alertMediaInputRef={alertMediaInputRef}
          />
        </Box>
      </Box>
    </Box>
  );
}