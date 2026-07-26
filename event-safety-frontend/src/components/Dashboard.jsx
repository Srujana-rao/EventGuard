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
import SidebarMenu from './SidebarMenu';

const topBarBg = '#ffffff';
const topBarTextColor = '#333';
const sidebarWidth = 220;
const API_BASE_URL = 'http://localhost:5000/api';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
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
      case 'info':
        return 'success';
      case 'urgent':
        return 'error';
      case 'important':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'stretch' }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, overflow: 'hidden' }}> 
        <Typography variant="h5" gutterBottom fontWeight={700}>
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
                  setAlertPriority("urgent");
                }}
              >
                Fire
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAlertMessage("Medical Emergency");
                  setAlertPriority("urgent");
                }}
              >
                Medical
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAlertMessage("Security Issue");
                  setAlertPriority("urgent");
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

            <Box sx={{ display: "flex", gap: 1 }}>
              {["all", "head", "room", "ground"].map((role) => (
                <Button
                  key={role}
                  variant={alertTargetRole === role ? "contained" : "outlined"}
                  onClick={() => setAlertTargetRole(role)}
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

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant={alertPriority === "info" ? "contained" : "outlined"}
                color="success"
                onClick={() => setAlertPriority("info")}
              >
                Info
              </Button>

              <Button
                variant={alertPriority === "important" ? "contained" : "outlined"}
                color="warning"
                onClick={() => setAlertPriority("important")}
              >
                Important
              </Button>

              <Button
                variant={alertPriority === "urgent" ? "contained" : "outlined"}
                color="error"
                onClick={() => setAlertPriority("urgent")}
              >
                Urgent
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

      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, overflowY: 'auto' }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
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
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

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
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        onLogout={handleLogout}
      />

      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          bgcolor: topBarBg,
          color: topBarTextColor,
          display: { md: 'none' },
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
          <SecurityIcon sx={{ fontSize: 22, color: '#667eea' }} />
          <Typography
            variant="h6"
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
        <Box sx={{ width: 44 }} />
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
        <Box
          sx={{
            width: '100%',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: topBarBg,
            color: topBarTextColor,
            px: { xs: 2, md: 2.5 },
            position: 'fixed',
            top: { xs: 64, md: 0 },
            left: 0,
            right: 0,
            zIndex: 1350,
            boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <SecurityIcon sx={{ fontSize: 50, color: '#667eea' }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EventGuard
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#667eea', lineHeight: 1.2 }}
                aria-live="polite"
              >
                Welcome, {username} ({userRole.charAt(0).toUpperCase() + userRole.slice(1)})
              </Typography>
              {myTeam && (
                <Typography variant="body1" sx={{ color: '#667eea', display: 'block', fontWeight: 'bold' }}>
                  Team: {myTeam.name}
                </Typography>
              )}
            </Box>
            <Avatar
              src={localStorage.getItem('profileAvatar') || undefined}
              sx={{ width: 36, height: 36, bgcolor: '#667eea' }}
            >
              {username ? username[0]?.toUpperCase() : ''}
            </Avatar>
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            p: 4,
            maxWidth: 1400,
            mx: 'auto',
            overflowY: 'auto',
            bgcolor: 'background.default',
            mt: '72px',
            minHeight: 'calc(100vh - 72px)',
          }}
          role="main"
        >
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