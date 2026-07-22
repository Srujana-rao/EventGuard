import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // Socket.IO client import
import './App.css'; // Main CSS
import LandingPage from './components/LandingPage';
import Signup from './components/Signup';
import Login from './components/Login';
import HeadDashboard from './components/HeadDashboard'; // Head Dashboard Component
import ForgotPassword from './components/ForgotPassword';
import ChangePassword from './components/ChangePassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import StaffInfo from './components/StaffInfo';
import Meetings from './components/Meetings';
import DashboardShell from './components/DashboardShell';
import Settings from './components/Settings';

// Socket.IO client instance
import { socket } from './socket';

function AppContent({ isAuthenticated, userRole, username, handleSetAuth }) {
  const [backendMessage, setBackendMessage] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [newIncidentType, setNewIncidentType] = useState('');
  const [newIncidentLocation, setNewIncidentLocation] = useState('');
  const [newIncidentMediaFile, setNewIncidentMediaFile] = useState(null);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState(null);

  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [meetingNotificationCount, setMeetingNotificationCount] = useState(0);

  // Alert Composer State
  const [alertMessage, setAlertMessage] = useState('');
  const [alertMediaFile, setAlertMediaFile] = useState(null);
  const [alertSendError, setAlertSendError] = useState(null);
  const [alertSendSuccess, setAlertSendSuccess] = useState('');
  const [alertTargetRole, setAlertTargetRole] = useState('all'); // 'all', 'head', 'room', 'ground'
  const [alertPriority, setAlertPriority] = useState('info'); // 'urgent', 'important', 'info'
  const [alertLocationTag, setAlertLocationTag] = useState('');

  // (AI Image Analysis removed)

  // React Refs for File Inputs
  const alertMediaInputRef = useRef(null);
  const incidentMediaInputRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleLogout = () => {
    handleSetAuth(false);
    socket.disconnect();
    window.location.href = '/';
  };

  /// Socket.IO Authentication & Event Listeners

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Only disconnect if absolutely no token
    if (!token) {
      if (socket.connected) {
        console.log('No token found, disconnecting socket...');
        socket.disconnect();
      }
      return;
    }

    const handleConnect = () => {
      console.log('Connected to Socket.IO backend!');
      console.log('Authenticating socket...');
      socket.emit('authenticate', token);
    };

    const handleAuthenticated = ({ status, user }) => {
      if (status) {
        console.log(`Socket authenticated for user: ${user.username} (${user.role})`);
      } else {
        console.error('Socket authentication failed!');
        handleSetAuth(false);
      }
    };

    const handleReceiveAlert = (alertData) => {
      setRealtimeAlerts((prev) => {
        if (prev.find((a) => a._id === alertData._id)) return prev;
        return [...prev, alertData];
      });
    };

    const handleNewIncident = () => {
      fetchIncidents();
    };

    const handleIncidentDeleted = (incidentId) => {
      setIncidents((prev) => prev.filter((inc) => inc._id !== incidentId));
    };

    const handleNewMeeting = (meeting) => {
      // Only notify if the meeting wasn't created by the current user
      if (meeting?.createdBy && meeting.createdBy === username) {
        return;
      }
      setMeetingNotificationCount((prev) => prev + 1);
    };

    const handleMeetingDeleted = () => {
      setMeetingNotificationCount((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const handleDisconnect = () => {
      console.log('Disconnected from Socket.IO backend!');
    };

    // attach listeners
    socket.on('connect', handleConnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('receive-alert', handleReceiveAlert);
    socket.on('new-incident', handleNewIncident);
    socket.on('incident-deleted', handleIncidentDeleted);
    socket.on('new-meeting', handleNewMeeting);
    socket.on('meeting-deleted', handleMeetingDeleted);
    socket.on('disconnect', handleDisconnect);

    // connect socket AFTER listeners
    if (!socket.connected) {
      console.log('Connecting socket...');
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('authenticated', handleAuthenticated);
      socket.off('receive-alert', handleReceiveAlert);
      socket.off('new-incident', handleNewIncident);
      socket.off('incident-deleted', handleIncidentDeleted);
      socket.off('new-meeting', handleNewMeeting);
      socket.off('meeting-deleted', handleMeetingDeleted);
      socket.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, handleSetAuth, username]);

  // Send Alert Handler
  const handleSendAlert = async (e) => {
    e.preventDefault();
    setAlertSendError(null);
    setAlertSendSuccess('');

    if (!alertMessage.trim() && !alertMediaFile) {
      setAlertSendError('Please enter a message or select a file.');
      return;
    }

    let mediaUrl = null;
    let mediaType = null;

    if (alertMediaFile) {
      try {
        const formData = new FormData();
        formData.append('alertMedia', alertMediaFile);

        const uploadRes = await axios.post(`${API_BASE_URL}/alert-media-upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        mediaUrl = uploadRes.data.mediaUrl;
        mediaType = alertMediaFile.type.split('/')[0];
        setAlertSendSuccess('Media uploaded! Sending alert...');
      } catch (err) {
        setAlertSendError(`Failed to upload media: ${err.response?.data?.message || err.message}`);
        return;
      }
    }

    const alertData = {
      message: alertMessage.trim(),
      sender: username,
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      mediaUrl: mediaUrl ? `http://localhost:5000${mediaUrl}` : null,
      mediaType,
      targetRole: alertTargetRole === 'all' ? null : alertTargetRole,
      priority: alertPriority,
      locationTag: alertLocationTag,
    };

    if (socket.connected) {
      socket.emit('send-alert', alertData);
      setAlertMessage('');
      setAlertMediaFile(null);
      if (alertMediaInputRef.current) alertMediaInputRef.current.value = '';
      setAlertPriority('info');
      setAlertLocationTag('');
      setAlertTargetRole('all');
      setAlertSendSuccess('Alert Sent!');
      setTimeout(() => setAlertSendSuccess(''), 3000);
    } else {
      setAlertSendError('Socket.IO not connected. Please check your connection.');
    }
  };

  // Backend status fetching
  useEffect(() => {
    axios.get('http://localhost:5000/')
      .then((response) => setBackendMessage(response.data))
      .catch(() => setBackendMessage('Failed to connect to backend.'));
  }, []);

  // Incident fetching
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentsError(null);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const res = await axios.get(`${API_BASE_URL}/incidents`, config);
      setIncidents(res.data);
    } catch {
      setIncidentsError('Failed to load incidents. Please try again.');
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchIncidents();
  }, [isAuthenticated]);

  // Add Incident Handler
  const handleAddIncident = async (e) => {
    e.preventDefault();
    setIncidentsError(null);

    let imageUrl = null;
    if (newIncidentMediaFile) {
      try {
        const formData = new FormData();
        formData.append('alertMedia', newIncidentMediaFile);

        const uploadRes = await axios.post(`${API_BASE_URL}/alert-media-upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        imageUrl = `http://localhost:5000${uploadRes.data.mediaUrl}`;
      } catch (err) {
        setIncidentsError(`Failed to upload incident media: ${err.response?.data?.message || err.message}`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      await axios.post(
        `${API_BASE_URL}/incidents`,
        {
          type: newIncidentType,
          location: newIncidentLocation,
          imageUrl,
        },
        config,
      );
      setNewIncidentType('');
      setNewIncidentLocation('');
      setNewIncidentMediaFile(null);
      if (incidentMediaInputRef.current) incidentMediaInputRef.current.value = '';
    } catch {
      setIncidentsError('Failed to add incident. Please try again.');
    }
  };

  // Delete Incident Handler
  const handleDeleteIncident = async (incidentId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      await axios.delete(`${API_BASE_URL}/incidents/${incidentId}`, config);
    } catch {
      setIncidentsError('Failed to delete incident. Please try again.');
    }
  };

  // (AI image analysis UI and effects removed)

  return (
    <Dashboard
      backendMessage={backendMessage}
      username={username}
      userRole={userRole}
      handleLogout={handleLogout}
      alertMessage={alertMessage}
      setAlertMessage={setAlertMessage}
      alertMediaFile={alertMediaFile}
      setAlertMediaFile={setAlertMediaFile}
      alertSendError={alertSendError}
      alertSendSuccess={alertSendSuccess}
      alertTargetRole={alertTargetRole}
      setAlertTargetRole={setAlertTargetRole}
      alertPriority={alertPriority}
      setAlertPriority={setAlertPriority}
      alertLocationTag={alertLocationTag}
      setAlertLocationTag={setAlertLocationTag}
      handleSendAlert={handleSendAlert}
      realtimeAlerts={realtimeAlerts}
      newIncidentType={newIncidentType}
      setNewIncidentType={setNewIncidentType}
      newIncidentLocation={newIncidentLocation}
      setNewIncidentLocation={setNewIncidentLocation}
      newIncidentMediaFile={newIncidentMediaFile}
      setNewIncidentMediaFile={setNewIncidentMediaFile}
      incidents={incidents}
      loadingIncidents={loadingIncidents}
      incidentsError={incidentsError}
      fetchIncidents={fetchIncidents}
      handleAddIncident={handleAddIncident}
      handleDeleteIncident={handleDeleteIncident}
      /* AI image analysis feature removed */
      alertMediaInputRef={alertMediaInputRef}
      incidentMediaInputRef={incidentMediaInputRef}
      meetingNotificationCount={meetingNotificationCount}
    />
  );
}

// Main App component for Routing
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);

  const handleSetAuth = (status) => {
    setIsAuthenticated(status);
    if (status) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUserRole(parsedUser.role);
          setUsername(parsedUser.username);
          const token = localStorage.getItem('token');
          if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
          }
        } catch (e) {
          console.error('Failed to parse user data from localStorage', e);
          localStorage.clear();
          setIsAuthenticated(false);
          setUserRole(null);
          setUsername(null);
        }
      }
    } else {
      setUserRole(null);
      setUsername(null);
      localStorage.clear();
      delete axios.defaults.headers.common['x-auth-token'];
    }
  };

useEffect(() => {

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {

    const parsedUser = JSON.parse(user);

    setIsAuthenticated(true);
    setUserRole(parsedUser.role);
    setUsername(parsedUser.username);

    axios.defaults.headers.common["x-auth-token"] = token;

  } else {

    setIsAuthenticated(false);
  }

}, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup setAuth={handleSetAuth} />} />
        <Route path="/login" element={<Login setAuth={handleSetAuth} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Social sign-in callback removed */}
        <Route
          path="/head-dashboard"
          element={
            userRole === 'head' ? (
              <DashboardShell title="User Approvals">
                <HeadDashboard userRole={userRole} />
              </DashboardShell>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <AppContent
                isAuthenticated={isAuthenticated}
                userRole={userRole}
                username={username}
                handleSetAuth={handleSetAuth}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/staff-info"
          element={
            isAuthenticated ? (
              <DashboardShell title="Staff Info">
                <StaffInfo />
              </DashboardShell>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/meetings"
          element={
            isAuthenticated ? (
              <DashboardShell title="Meetings">
                <Meetings userRole={userRole} />
              </DashboardShell>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <DashboardShell title="Settings">
                <Settings />
              </DashboardShell>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/*"
           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
