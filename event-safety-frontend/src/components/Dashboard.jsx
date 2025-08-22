import React, { useState, useEffect, useCallback } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HeadDashboard from './HeadDashboard';
import {
  Box,
  Paper,
  Tabs,
  Tab,
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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';

const darkBlue = '#0f172a'; // Dark navy blue

const sidebarWidth = 220;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

// SidebarMenu component for reuse and responsive drawer
function SidebarMenu({
  userRole,
  approvalsPending,
  mobileOpen,
  onDrawerToggle,
  onLogout,
}) {
  const location = useLocation();
  const matchDashboard = location.pathname === '/';
  const matchHeadDashboard = location.pathname === '/head-dashboard';

  const buttons = [
    {
      label: 'Main Dashboard',
      to: '/',
      icon: <NotificationsActiveIcon />,
      showBadge: true,
      badgeContent: null, // Will be updated by parent usage if needed
      active: matchDashboard,
    },
  ];

  if (userRole === 'head') {
  buttons.push({
    label: 'User Approvals',
    to: '/head-dashboard',
    icon: <AdminPanelSettingsIcon />,
    showBadge: true,
    badgeContent: approvalsPending, // pass the count here
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
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarWidth,
            bgcolor: darkBlue,
            color: 'white',
          },
        }}
      >
        <List
          sx={{
            mt: 6,
          }}
        >
          {buttons.map(({ label, to, icon, showBadge, badgeContent, active }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
  component={Link}
  to={to}
  selected={active}
  sx={{
    color: 'white',
    '&.Mui-selected': {
      bgcolor: '#3951a3',
    },
    '&:hover': { bgcolor: '#3951a3' },
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
              color="secondary"
              onClick={onLogout}
              fullWidth
              sx={{
                fontWeight: 700,
                bgcolor: '#397ebaff',
                ':hover': { bgcolor: '#0a335a' },
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
          bgcolor: darkBlue,
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
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 0.5,
            mb: 5,
            userSelect: 'none',
            background: 'linear-gradient(90deg, #f7b733, #fc4a1a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          EventGuard
        </Typography>
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
    backgroundColor: active ? '#3951a3' : 'inherit',
    '&:hover': {
      backgroundColor: '#3951a3',
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
          color="secondary"
          onClick={onLogout}
          sx={{ mt: 4, width: '100%', fontWeight: 700, bgcolor: '#397ebaff', ':hover': { bgcolor: '#0a335a' } }}
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
  // Validate Send Alert form
  const isSendAlertDisabled =
    !alertMessage.trim() ||
    !alertTargetRole ||
    !alertPriority;

  // Priority chip color helper
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'info':
        return 'success'; // green chip
      case 'urgent':
        return 'error'; // red chip
      case 'important':
        return 'warning'; // orange chip
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
      {/* Send Alert */}
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Send Alert
        </Typography>
        <Box component="form" onSubmit={handleSendAlert} noValidate>
          <TextField
            label="Message"
            variant="outlined"
            fullWidth
            placeholder="Enter alert message"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            sx={{ mb: 3 }}
            required
            inputProps={{ 'aria-label': 'Alert message' }}
          />
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
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={(e) => {
              if (e.target.files.length > 0) {
                setAlertMediaFile(e.target.files[0]);
              } else {
                setAlertMediaFile(null);
              }
            }}
            style={{ marginBottom: 20 }}
            ref={alertMediaInputRef}
            aria-label="Select alert media file"
          />
          <FormControl fullWidth sx={{ mb: 3 }} required>
            <InputLabel id="send-to-label">Send To</InputLabel>
            <Select
              labelId="send-to-label"
              value={alertTargetRole}
              label="Send To"
              onChange={(e) => setAlertTargetRole(e.target.value)}
              aria-required="true"
              aria-label="Select alert recipient group"
            >
              <MenuItem value="all">All Members</MenuItem>
              <MenuItem value="head">Heads Only</MenuItem>
              <MenuItem value="room">Security Room</MenuItem>
              <MenuItem value="ground">On Ground</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 3 }} required>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              value={alertPriority}
              label="Priority"
              onChange={(e) => setAlertPriority(e.target.value)}
              aria-required="true"
              aria-label="Select alert priority"
            >
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="important">Important</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Location Tag"
            variant="outlined"
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

      {/* Real-time Alerts Feed */}
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, maxHeight: 460, overflowY: 'auto' }}>
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
      {/* Add New Incident Form */}
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Add New Incident
        </Typography>
        <Box component="form" onSubmit={handleAddIncident} noValidate>
          <TextField
            label="Incident Type"
            variant="outlined"
            fullWidth
            placeholder="Enter incident type"
            value={newIncidentType}
            onChange={(e) => setNewIncidentType(e.target.value)}
            sx={{ mb: 3 }}
            required
            inputProps={{ 'aria-label': 'Incident type' }}
          />
          <TextField
            label="Location"
            variant="outlined"
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

      {/* Recorded Incidents List */}
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

const AIAnalysisTab = ({
  selectedImage,
  handleImageChange,
  handleAnalyzeImage,
  aiAnalysisLoading,
  aiAnalysisError,
  imagePreviewUrl,
  aiDetections,
  canvasRef,
}) => {
  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        AI Image Analysis
      </Typography>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ marginBottom: 20 }}
        aria-label="Select image for AI analysis"
      />
      <Button
        onClick={handleAnalyzeImage}
        disabled={aiAnalysisLoading || !selectedImage}
        variant="contained"
        color="secondary"
        fullWidth
        sx={{ py: 1, fontSize: '0.875rem' }}
        aria-disabled={aiAnalysisLoading || !selectedImage}
        aria-label="Analyze image"
      >
        {aiAnalysisLoading ? 'Analyzing...' : 'Analyze Image'}
      </Button>
      {aiAnalysisError && (
        <Typography variant="body2" color="error" mt={2} fontWeight={600} role="alert">
          {aiAnalysisError}
        </Typography>
      )}
      {imagePreviewUrl && (
        <Box mt={4}>
          <Typography variant="subtitle1" fontWeight={600}>
            Detected Objects:
          </Typography>
          <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 600 }} aria-label="AI detection canvas" />
          {aiDetections.length > 0 && (
            <Box mt={3}>
              <ul>
                {aiDetections.map((det, idx) => (
                  <li key={idx}>
                    {det.className} ({(det.probability * 100).toFixed(1)}%) - Box: ({det.box.left.toFixed(0)},{' '}
                    {det.box.top.toFixed(0)}) to ({det.box.right.toFixed(0)}, {det.box.bottom.toFixed(0)})
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </Box>
      )}
    </Paper>
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
  handleImageChange,
  handleAnalyzeImage,
  aiAnalysisLoading,
  selectedImage,
  aiAnalysisError,
  imagePreviewUrl,
  aiDetections,
  canvasRef,
  alertMediaInputRef,
  incidentMediaInputRef,
  approvalsPending,
}) {
  const [activeTab, setActiveTab] = useState('alerts');
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const isHeadDashboard = location.pathname === '/head-dashboard';

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Helper to get alert badge color for Alerts tab
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'info':
        return 'success'; // green chip
      case 'urgent':
        return 'error'; // red chip
      case 'important':
        return 'warning'; // orange chip
      default:
        return 'default';
    }
  };

  // Keyboard escape should close mobile drawer
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
        width: '100vw',
        bgcolor: '#f0f2f5',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Sidebar */}
      <SidebarMenu
        userRole={userRole}
        approvalsPending={approvalsPending}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        onLogout={handleLogout}
      />

      {/* For mobile: App bar with menu button */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          bgcolor: darkBlue,
          color: 'white',
          display: { md: 'none' },
          alignItems: 'center',
          px: 2,
          zIndex: 1400,
          boxShadow: 3,
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          aria-label="Open sidebar menu"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        <Typography variant="h6" fontWeight={500} noWrap>
          EventGuard
        </Typography>
        <Box sx={{ width: 44 }} />
      </Box>

      {/* Main area */}
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
        {/* Top bar */}
        <Box
          sx={{
            width: '100%',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkBlue,
            color: 'white',
            px: 4,
            position: 'fixed',
            top: { xs: 64, md: 0 },
            left: { xs: 0, md: sidebarWidth },
            right: 0,
            zIndex: 1350,
            boxShadow: 3,
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 500,
              letterSpacing: 0.5,
              minWidth: 180,
              
              textAlign: 'center',
              flexGrow: 1,
            }}
            aria-live="polite"
          >
            {isHeadDashboard
              ? `User Approvals Pending (${approvalsPending})`
              : `Welcome, ${username} (${userRole})`}
          </Typography>
        </Box>

        {/* Tabs for navigation (only on Main Dashboard) */}
        {!isHeadDashboard && (
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mt: '64px',
              bgcolor: 'white',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              centered
              aria-label="Dashboard main tabs"
              sx={{ backgroundColor: 'white' }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon fontSize="small" />
                    Alerts ({realtimeAlerts.length})
                  </Box>
                }
                value="alerts"
                id="tab-alerts"
                aria-controls="tabpanel-alerts"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddCircleOutlineIcon fontSize="small" />
                    New Incident ({incidents.length})
                  </Box>
                }
                value="newIncident"
                id="tab-newincident"
                aria-controls="tabpanel-newincident"
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageSearchIcon fontSize="small" />
                    AI Image Analysis
                  </Box>
                }
                value="aiAnalysis"
                id="tab-aianalysis"
                aria-controls="tabpanel-aianalysis"
              />
            </Tabs>
          </Box>
        )}

        {/* Main content container */}
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            p: 4,
            maxWidth: 1400,
            mx: 'auto',
            overflowY: 'auto',
            bgcolor: 'background.default',
            mt: isHeadDashboard ? '64px' : 0,
            minHeight: 'calc(100vh - 64px)',
          }}
          role="main"
        >
          {isHeadDashboard ? (
            // Show head dashboard content as route
            <Routes>
              <Route path="/head-dashboard" element={<HeadDashboard />} />
              <Route path="*" element={<Navigate to="/head-dashboard" />} />
            </Routes>
          ) : (
            <>
              {activeTab === 'alerts' && (
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
              {activeTab === 'newIncident' && (
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
              )}
              {activeTab === 'aiAnalysis' && (
                <AIAnalysisTab
                  selectedImage={selectedImage}
                  handleImageChange={handleImageChange}
                  handleAnalyzeImage={handleAnalyzeImage}
                  aiAnalysisLoading={aiAnalysisLoading}
                  aiAnalysisError={aiAnalysisError}
                  imagePreviewUrl={imagePreviewUrl}
                  aiDetections={aiDetections}
                  canvasRef={canvasRef}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
