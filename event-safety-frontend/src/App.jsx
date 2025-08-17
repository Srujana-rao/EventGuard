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
import ResetPassword from './components/ResetPassword';
import SocialSuccess from './components/SocialSuccess';
import Dashboard from './components/Dashboard';

// Socket.IO client instance
const socket = io('http://localhost:5000', {
  autoConnect: false,
});

function AppContent({ isAuthenticated, userRole, username, handleSetAuth }) {
  const [backendMessage, setBackendMessage] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [newIncidentType, setNewIncidentType] = useState('');
  const [newIncidentLocation, setNewIncidentLocation] = useState('');
  const [newIncidentMediaFile, setNewIncidentMediaFile] = useState(null);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState(null);

  const [realtimeAlerts, setRealtimeAlerts] = useState([]);

  // Alert Composer State
  const [alertMessage, setAlertMessage] = useState('');
  const [alertMediaFile, setAlertMediaFile] = useState(null);
  const [alertSendError, setAlertSendError] = useState(null);
  const [alertSendSuccess, setAlertSendSuccess] = useState('');
  const [alertTargetRole, setAlertTargetRole] = useState('all'); // 'all', 'head', 'room', 'ground'
  const [alertPriority, setAlertPriority] = useState('info'); // 'urgent', 'important', 'info'
  const [alertLocationTag, setAlertLocationTag] = useState('');

  // AI Image Analysis State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [aiDetections, setAiDetections] = useState([]);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState(null);
  const canvasRef = useRef(null);

  // React Refs for File Inputs
  const alertMediaInputRef = useRef(null);
  const incidentMediaInputRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleLogout = () => {
    handleSetAuth(false);
    socket.disconnect();
    window.location.href = '/';
  };

  // Socket.IO Authentication & Event Listeners
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (isAuthenticated && token) {
      socket.auth = { token };
      setTimeout(() => {
        if (!socket.connected) {
          console.log('Socket not connected, attempting to connect...');
          socket.connect();
        } else {
          socket.emit('authenticate', token);
        }
      }, 50);
    } else {
      if (socket.connected) {
        console.log('User not authenticated, disconnecting socket...');
        socket.disconnect();
      } else {
        console.log('User not authenticated and socket already disconnected/not connected.');
      }
    }

    // Socket.IO event listeners
    socket.on('connect', () => {
      console.log('Connected to Socket.IO backend!');
    });

    socket.on('authenticated', ({ status, user }) => {
      if (status) {
        console.log(`Socket authenticated for user: ${user.username} (${user.role})`);
      } else {
        console.error('Socket authentication failed!');
        handleSetAuth(false);
      }
    });

    socket.on('receive-alert', (alertData) => {
      setRealtimeAlerts((prevAlerts) => [...prevAlerts, alertData]);
    });

    socket.on('new-incident', () => {
      fetchIncidents();
    });

    socket.on('incident-deleted', (incidentId) => {
      setIncidents((prevIncidents) => prevIncidents.filter((inc) => inc._id !== incidentId));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO backend!');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'jwt expired' || err.message === 'Invalid token') {
        handleSetAuth(false);
        console.log('Your session expired or token is invalid. Please log in again.');
      }
    });

    // Clean up event listeners
    return () => {
      socket.off('connect');
      socket.off('authenticated');
      socket.off('receive-alert');
      socket.off('new-incident');
      socket.off('incident-deleted');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [isAuthenticated, handleSetAuth]);

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

  // AI Image Analysis Handlers
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setAiDetections([]);
      setAiAnalysisError(null);
      setAiAnalysisLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setAiAnalysisError('Please select an image to analyze.');
      return;
    }
    setAiAnalysisLoading(true);
    setAiDetections([]);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } } : { headers: { 'Content-Type': 'multipart/form-data' } };
      const response = await axios.post(`${API_BASE_URL}/analyze-image`, formData, config);
      setAiDetections(response.data.detections || []);
    } catch (err) {
      if (err.response) setAiAnalysisError(`AI Service Error: ${err.response.data.message || err.response.statusText}`);
      else if (err.request) setAiAnalysisError('No response from AI Service. Is the backend and Python service running?');
      else setAiAnalysisError(`Analysis failed: ${err.message}`);
      setAiDetections([]);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagePreviewUrl) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imagePreviewUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height);

      aiDetections.forEach((detection) => {
        const { className, probability, box } = detection;
        const { left, top, right, bottom } = box;

        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'lime';
        ctx.fillStyle = 'lime';
        ctx.stroke();

        const label = `${className} (${(probability * 100).toFixed(1)}%)`;
        ctx.font = '24px Roboto';
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 24;

        ctx.fillRect(left, top - textHeight - 10, textWidth + 10, textHeight + 10);
        ctx.fillStyle = 'black';
        ctx.fillText(label, left + 5, top - 5);
      });
    };
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, aiDetections]);

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
      handleImageChange={handleImageChange}
      handleAnalyzeImage={handleAnalyzeImage}
      aiAnalysisLoading={aiAnalysisLoading}
      selectedImage={selectedImage}
      aiAnalysisError={aiAnalysisError}
      imagePreviewUrl={imagePreviewUrl}
      aiDetections={aiDetections}
      canvasRef={canvasRef}
      alertMediaInputRef={alertMediaInputRef}
      incidentMediaInputRef={incidentMediaInputRef}
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
    handleSetAuth(!!localStorage.getItem('token'));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup setAuth={handleSetAuth} />} />
        <Route path="/login" element={<Login setAuth={handleSetAuth} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/social-success" element={<SocialSuccess setAuth={handleSetAuth} />} />
        <Route
          path="/head-dashboard"
          element={userRole === 'head' ? <HeadDashboard userRole={userRole} /> : <Navigate to="/" />}
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
          path="/*"
          element={<Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
