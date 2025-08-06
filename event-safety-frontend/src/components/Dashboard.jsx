import React, { useState } from 'react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const darkBlue = '#0f172a'; // Dark navy blue

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
}) {
  const [activeTab, setActiveTab] = useState('alerts');

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  // Helper to get alert badge color
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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        bgcolor: '#f0f2f5',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: 220,
          minHeight: '100vh',
          bgcolor: darkBlue,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          px: 3,
          py: 5,
          boxShadow: 3,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 0.5,
            mb: 5,
            userSelect: 'none',
          }}
        >
          EventGuard
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            component={Link}
            to="/"
            variant="text"
            color="inherit"
            sx={{
              justifyContent: 'flex-start',
              fontWeight: 600,
              fontSize: 16,
              textTransform: 'none',
            }}
            fullWidth
          >
            Main Dashboard
          </Button>
          {userRole === 'head' && (
            <Button
              component={Link}
              to="/head-dashboard"
              variant="text"
              color="inherit"
              sx={{
                justifyContent: 'flex-start',
                fontWeight: 600,
                fontSize: 16,
                textTransform: 'none',
              }}
              fullWidth
            >
              User Approvals
            </Button>
          )}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ mt: 4, width: '100%', fontWeight: 700, bgcolor: '#397ebaff', ':hover': { bgcolor: '#0a335a' } }}
        >
          Logout
        </Button>
      </Box>

      {/* Main area */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
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
          >
            Welcome, {username} ({userRole})
          </Typography>
        </Box>

        {/* Tabs for navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            centered
            sx={{ backgroundColor: 'white' }}
          >
            <Tab label={`Alerts (${realtimeAlerts.length})`} value="alerts" />
            <Tab label={`New Incident (${incidents.length})`} value="newIncident" />
            <Tab label="AI Image Analysis" value="aiAnalysis" />
          </Tabs>
        </Box>

        {/* Main content */}
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            p: 4,
            maxWidth: 1400,
            mx: 'auto',
            overflowY: 'auto',
            bgcolor: 'background.default',
          }}
        >


          {activeTab === 'alerts' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              {/* Send Alert */}
              <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  Send Alert
                </Typography>
                <Box component="form" onSubmit={handleSendAlert}>
                  <TextField
                    label="Message"
                    variant="outlined"
                    fullWidth
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    sx={{ mb: 3 }}
                    required
                  />
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => setAlertMediaFile(e.target.files[0])}
                    style={{ marginBottom: 20 }}
                    ref={alertMediaInputRef}
                  />
                  <FormControl fullWidth sx={{ mb: 3 }} required>
                    <InputLabel id="send-to-label">Send To</InputLabel>
                    <Select
                      labelId="send-to-label"
                      value={alertTargetRole}
                      label="Send To"
                      onChange={(e) => setAlertTargetRole(e.target.value)}
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
                    value={alertLocationTag}
                    onChange={(e) => setAlertLocationTag(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Button type="submit" variant="contained" color="primary" startIcon={<SendIcon />} fullWidth sx={{ py: 1.8 }}>
                    Send Alert
                  </Button>
                  {alertSendSuccess && (
                    <Typography variant="body2" color="success.main" mt={2} fontWeight={600}>
                      {alertSendSuccess}
                    </Typography>
                  )}
                  {alertSendError && (
                    <Typography variant="body2" color="error" mt={2} fontWeight={600}>
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
                      <Box component="li" key={index} sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography flexGrow={1}>
                          <strong>ALERT:</strong> {alert.message}
                          <br />
                          From: {alert.sender} ({alert.senderRole})
                          {alert.locationTag && <span> at {alert.locationTag}</span>}
                          <br />
                          Time: {new Date(alert.timestamp).toLocaleTimeString()}
                        </Typography>
                        <Chip label={alert.priority?.toUpperCase()} color={getPriorityColor(alert.priority)} size="small" />
                        {alert.mediaUrl && (
                          <Box mt={1} sx={{ width: '100%' }}>
                            {alert.mediaType === 'image' && <img src={alert.mediaUrl} alt="Alert Media" style={{ width: '100%', borderRadius: 4 }} />}
                            {alert.mediaType === 'video' && <video controls src={alert.mediaUrl} style={{ width: '100%', borderRadius: 4 }} />}
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
          )}

          {activeTab === 'newIncident' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              {/* Add New Incident Form */}
              <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  Add New Incident
                </Typography>
                <Box component="form" onSubmit={handleAddIncident}>
                  <TextField
                    label="Incident Type"
                    variant="outlined"
                    fullWidth
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value)}
                    sx={{ mb: 3 }}
                    required
                  />
                  <TextField
                    label="Location"
                    variant="outlined"
                    fullWidth
                    value={newIncidentLocation}
                    onChange={(e) => setNewIncidentLocation(e.target.value)}
                    sx={{ mb: 3 }}
                    required
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewIncidentMediaFile(e.target.files[0])}
                    style={{ marginBottom: 20, display: 'block' }}
                    ref={incidentMediaInputRef}
                  />
                  <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.8 }}>
                    Add Incident
                  </Button>
                  {incidentsError && (
                    <Typography variant="body2" color="error" mt={2} fontWeight={600}>
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
                {incidentsError && (
                  <Typography color="error.main" fontWeight={600}>
                    {incidentsError}
                  </Typography>
                )}
                {!loadingIncidents && incidents.length === 0 && <Typography>No incidents found. Add one!</Typography>}
                {!loadingIncidents && incidents.length > 0 && (
                  <ul>
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
                        <Button variant="contained" color="error" size="small" onClick={() => handleDeleteIncident(incident._id)}>
                          Delete Incident
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Paper>
            </Box>
          )}

          {activeTab === 'aiAnalysis' && (
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                AI Image Analysis
              </Typography>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: 20 }} />
              <Button
                onClick={handleAnalyzeImage}
                disabled={aiAnalysisLoading || !selectedImage}
                variant="contained"
                color="secondary"
                fullWidth
                sx={{ py: 1.8 }}
              >
                {aiAnalysisLoading ? 'Analyzing...' : 'Analyze Image'}
              </Button>
              {aiAnalysisError && (
                <Typography variant="body2" color="error" mt={2} fontWeight={600}>
                  {aiAnalysisError}
                </Typography>
              )}
              {imagePreviewUrl && (
                <Box mt={4}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Detected Objects:
                  </Typography>
                  <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 600 }} />
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
          )}
        </Box>
      </Box>
    </Box>
  );
}
