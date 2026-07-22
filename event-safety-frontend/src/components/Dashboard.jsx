import React, { useState, useEffect, useCallback } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HeadDashboard from './HeadDashboard';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Alert as MuiAlert,
  Badge,
  IconButton,
  Avatar,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';

const sidebarGradient = 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)';
const topBarBg = '#ffffff';
const topBarTextColor = '#333';

const sidebarWidth = 220;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function SidebarMenu({
  userRole,
  approvalsPending,
  mobileOpen,
  onDrawerToggle,
  onLogout,
  meetingNotificationCount = 0,
}) {
  const location = useLocation();
  const matchDashboard = location.pathname === '/dashboard';
  const matchIncidents = location.pathname === '/incidents';
  const matchHeadDashboard = location.pathname === '/head-dashboard';
  const matchStaffInfo = location.pathname === '/staff-info';
  const matchMeetings = location.pathname === '/meetings';
  const matchSettings = location.pathname === '/settings';

  const buttons = [
    {
      label: 'Main Dashboard',
      to: '/dashboard',
      icon: <NotificationsActiveIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchDashboard,
    },
    {
      label: 'Report Incident',
      to: '/incidents',
      icon: <AddCircleOutlineIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchIncidents,
    },
    {
      label: 'Staff Info',
      to: '/staff-info',
      icon: <GroupsIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchStaffInfo,
    },
    {
      label: 'Meetings',
      to: '/meetings',
      icon: <EventNoteIcon />,
      showBadge: meetingNotificationCount > 0,
      badgeContent: meetingNotificationCount,
      active: matchMeetings,
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: <SettingsIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchSettings,
    },
  ];

  if (userRole === 'head') {
    buttons.push({
      label: 'User Approvals',
      to: '/head-dashboard',
      icon: <AdminPanelSettingsIcon />,
      showBadge: true,
      badgeContent: approvalsPending,
      active: matchHeadDashboard,
    });
  }

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarWidth,
            background: sidebarGradient,
            color: 'white',
          },
        }}
      >
        <List sx={{ mt: 6 }}>
          {buttons.map(({ label, to, icon, showBadge, badgeContent, active }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
                component={Link}
                to={to}
                selected={active}
                sx={{
                  color: 'white',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.18)',
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                }}
                onClick={onDrawerToggle}
                aria-label={`Go to ${label}`}
              >
                <ListItemIcon sx={{ color: 'white' }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
                {showBadge && badgeContent > 0 && (
                  <Badge badgeContent={badgeContent} color="error" max={99} sx={{ mr: 3 }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ px: 2, pb: 2, mt: 1 }}>
            <Button
              variant="contained"
              onClick={onLogout}
              fullWidth
              sx={{
                fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                ':hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
              aria-label="Logout"
            >
              Logout
            </Button>
          </Box>
        </List>
      </Drawer>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: sidebarWidth,
          background: sidebarGradient,
          color: 'white',
          flexDirection: 'column',
          alignItems: 'start',
          px: 3,
          py: 5,
          boxShadow: 3,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1300,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 5 }}>
          <SecurityIcon sx={{ fontSize: 28, color: '#ffd700' }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 0.5,
              userSelect: 'none',
              color: '#ffd700',
            }}
          >
            EventGuard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          {buttons.map(({ label, to, icon, showBadge, badgeContent, active }) => (
            <Button
              key={label}
              component={Link}
              to={to}
              variant="text"
              color="inherit"
              sx={{
                justifyContent: 'flex-start',
                fontWeight: 600,
                fontSize: 16,
                textTransform: 'none',
                width: '100%',
                backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'inherit',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.12)',
                },
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={`Go to ${label}`}
            >
              {icon}
              <span style={{ flexGrow: 1 }}>{label}</span>
              {showBadge && badgeContent > 0 && (
                <Chip
                  label={badgeContent > 99 ? '99+' : badgeContent}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 'bold', ml: 'auto' }}
                  aria-label={`${badgeContent} pending approvals`}
                />
              )}
            </Button>
          ))}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          onClick={onLogout}
          sx={{
            mt: 4,
            width: '100%',
            fontWeight: 700,
            bgcolor: 'rgba(255,255,255,0.15)',
            color: 'white',
            ':hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
          aria-label="Logout"
        >
          Logout
        </Button>
      </Box>
    </>
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
            sx={{ mb: 3 }}
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
            placeholder="Enter location (optional)"
            value={alertLocationTag}
            onChange={(e) => setAlertLocationTag(e.target.value)}
            sx={{ mb: 3 }}
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
                  From: {alert.sender} ({alert.senderRole})
                  {alert.locationTag && <span> at {alert.locationTag}</span>}
                  <br />
                  Time: {new Date(alert.timestamp).toLocaleTimeString()}
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

const NewIncidentTab = ({
  newIncidentType,
  setNewIncidentType,
  newIncidentLocation,
  setNewIncidentLocation,
  newIncidentMediaFile,
  setNewIncidentMediaFile,
  handleAddIncident,
  incidents,
  loadingIncidents,
  incidentsError,
  fetchIncidents,
  handleDeleteIncident,
  incidentMediaInputRef,
}) => {
  const isAddIncidentDisabled =
    !newIncidentType.trim() || !newIncidentLocation.trim();

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Add New Incident
        </Typography>
        <Box component="form" onSubmit={handleAddIncident} noValidate>
          <TextField
            variant="standard"
            fullWidth
            placeholder="Enter incident type"
            value={newIncidentType}
            onChange={(e) => setNewIncidentType(e.target.value)}
            sx={{
              mb: 3,
              maxWidth: '100%',
              '& .MuiInputBase-root': {
                width: '100%',
              },
              '& .MuiInput-underline:before': {
                left: 0,
                right: 0,
              },
              '& .MuiInput-underline:after': {
                left: 0,
                right: 0,
              },
            }}
            required
            inputProps={{ 'aria-label': 'Incident type' }}
          />

          <TextField
            variant="standard"
            fullWidth
            placeholder="Enter location"
            value={newIncidentLocation}
            onChange={(e) => setNewIncidentLocation(e.target.value)}
            sx={{ mb: 3 }}
            required
            inputProps={{ 'aria-label': 'Incident location' }}
          />
          {newIncidentMediaFile && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Selected image preview:
              </Typography>
              <img
                src={URL.createObjectURL(newIncidentMediaFile)}
                alt="Incident preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
              />
            </Box>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files.length > 0) {
                setNewIncidentMediaFile(e.target.files[0]);
              } else {
                setNewIncidentMediaFile(null);
              }
            }}
            style={{ marginBottom: 20, display: 'block' }}
            ref={incidentMediaInputRef}
            aria-label="Select incident image file"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isAddIncidentDisabled}
            sx={{ py: 1.8 }}
            aria-disabled={isAddIncidentDisabled}
            aria-label="Add incident"
          >
            Add Incident
          </Button>
          {incidentsError && (
            <Typography variant="body2" color="error" mt={2} fontWeight={600} role="alert">
              {incidentsError}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, maxHeight: 620, overflowY: 'auto' }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Recorded Incidents
        </Typography>
        <Button onClick={fetchIncidents} disabled={loadingIncidents} variant="outlined" sx={{ mb: 3 }}>
          {loadingIncidents ? 'Loading...' : 'Refresh Incidents'}
        </Button>
        {loadingIncidents && <Typography>Loading incidents...</Typography>}
        {!loadingIncidents && incidents.length === 0 && <Typography>No incidents found. Add one!</Typography>}
        {!loadingIncidents && incidents.length > 0 && (
          <ul aria-live="polite">
            {incidents.map((incident) => (
              <li key={incident._id} style={{ marginBottom: 18 }}>
                <Typography>
                  <strong>Type:</strong> {incident.type} <br />
                  <strong>Location:</strong> {incident.location} <br />
                  <strong>Time:</strong> {new Date(incident.timestamp).toLocaleString()}
                </Typography>
                {incident.imageUrl && (
                  <Box mt={1} mb={2}>
                    <img
                      src={incident.imageUrl}
                      alt="Incident"
                      style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 4 }}
                    />
                    <Typography mt={1}>
                      <a href={incident.imageUrl} target="_blank" rel="noopener noreferrer">
                        View Image
                      </a>
                    </Typography>
                  </Box>
                )}
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDeleteIncident(incident._id)}
                  aria-label={`Delete incident ${incident.type} at ${incident.location}`}
                >
                  Delete Incident
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Paper>
    </Box>
  );
};

export default function Dashboard({
  backendMessage,
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
  newIncidentType,
  setNewIncidentType,
  newIncidentLocation,
  setNewIncidentLocation,
  newIncidentMediaFile,
  setNewIncidentMediaFile,
  incidents,
  loadingIncidents,
  incidentsError,
  fetchIncidents,
  handleAddIncident,
  handleDeleteIncident,
  alertMediaInputRef,
  incidentMediaInputRef,
  approvalsPending,
  meetingNotificationCount,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const isHeadDashboard = location.pathname === '/head-dashboard';
  const isIncidentsPage = location.pathname === '/incidents';

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
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        onLogout={handleLogout}
        meetingNotificationCount={meetingNotificationCount}
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
          {/* Logo - top left */}
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

          {/* Welcome text + avatar - top right */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: '#667eea' }}
              aria-live="polite"
            >
              {isHeadDashboard
                ? `User Approvals Pending (${approvalsPending})`
                : `Welcome, ${username} (${userRole})`}
            </Typography>
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
          {isHeadDashboard ? (
            <Routes>
              <Route path="/head-dashboard" element={<HeadDashboard />} />
              <Route path="*" element={<Navigate to="/head-dashboard" />} />
            </Routes>
          ) : isIncidentsPage ? (
            <Routes>
              <Route
                path="/incidents"
                element={
                  <NewIncidentTab
                    newIncidentType={newIncidentType}
                    setNewIncidentType={setNewIncidentType}
                    newIncidentLocation={newIncidentLocation}
                    setNewIncidentLocation={setNewIncidentLocation}
                    newIncidentMediaFile={newIncidentMediaFile}
                    setNewIncidentMediaFile={setNewIncidentMediaFile}
                    handleAddIncident={handleAddIncident}
                    incidents={incidents}
                    loadingIncidents={loadingIncidents}
                    incidentsError={incidentsError}
                    fetchIncidents={fetchIncidents}
                    handleDeleteIncident={handleDeleteIncident}
                    incidentMediaInputRef={incidentMediaInputRef}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/incidents" />} />
            </Routes>
          ) : (
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
          )}
        </Box>
      </Box>
    </Box>
  );
}