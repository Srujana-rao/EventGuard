import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client'; // Socket.IO client import
import './App.css'; // Main CSS
import Signup from './components/Signup';
import Login from './components/Login';
import HeadDashboard from './components/HeadDashboard'; // Head Dashboard Component

// Socket.IO client instance
// autoConnect: false prevents connection until we explicitly call socket.connect() after authentication
const socket = io('http://localhost:5000', {
  autoConnect: false 
});

function AppContent({ isAuthenticated, userRole, username, handleSetAuth }) {
  const [backendMessage, setBackendMessage] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [newIncidentType, setNewIncidentType] = useState('');
  const [newIncidentLocation, setNewIncidentLocation] = useState('');
  const [newIncidentMediaFile, setNewIncidentMediaFile] = useState(null); // NEW for incident media
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState(null);

  const [realtimeAlerts, setRealtimeAlerts] = useState([]); // For real-time alerts feed

  // ALERT COMPOSER STATE
  const [alertMessage, setAlertMessage] = useState('');
  const [alertMediaFile, setAlertMediaFile] = useState(null);
  const [alertSendError, setAlertSendError] = useState(null);
  const [alertSendSuccess, setAlertSendSuccess] = useState('');
  const [alertTargetRole, setAlertTargetRole] = useState('all'); // 'all', 'head', 'room', 'ground'
  const [alertPriority, setAlertPriority] = useState('info'); // 'urgent', 'important', 'info'
  const [alertLocationTag, setAlertLocationTag] = useState('');


  // AI IMAGE ANALYSIS (MANUAL UPLOAD) STATE
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [aiDetections, setAiDetections] = useState([]);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState(null);
  const canvasRef = useRef(null);

  // CROWD COUNT STATE (Removed from UI display and active logic, but states kept for clarity if reactivated)
  const [currentPersonCount, setCurrentPersonCount] = useState(0); 
  const [crowdAnalysisLoading, setCrowdAnalysisLoading] = useState(false); 
  const [crowdAnalysisError, setCrowdAnalysisError] = useState(null); 


  const API_BASE_URL = 'http://localhost:5000/api';

  const handleLogout = () => {
    handleSetAuth(false);
    socket.disconnect(); // Explicitly disconnect Socket.IO on logout
  };

  // --- Socket.IO Authentication & Event Listeners ---
  useEffect(() => {
    // Authenticate socket after successful login or on page load if token exists
    if (isAuthenticated && localStorage.getItem('token')) {
      socket.auth = { token: localStorage.getItem('token') }; // Attach JWT token to socket's auth payload
      if (!socket.connected) {
        console.log('Socket not connected, attempting to connect...');
        socket.connect(); // Connect the socket if not already connected
      } else {
        // If already connected, re-emit authentication for robustness (e.g. if token changed)
        socket.emit('authenticate', localStorage.getItem('token')); 
      }
    } else {
        // If not authenticated (e.g., logged out), disconnect the socket
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
            handleSetAuth(false); // Force logout
        }
    });

    // Listen for incoming alerts (Updates real-time feed ONLY)
    socket.on('receive-alert', (alertData) => {
      console.log('Alert received from backend:', alertData);
      setRealtimeAlerts(prevAlerts => [...prevAlerts, alertData]); // Add to real-time feed
    });

    // Listen for new incidents (emitted from backend when an incident is added)
    socket.on('new-incident', (newIncident) => {
        console.log('New incident received via Socket.IO:', newIncident);
        fetchIncidents(); // Re-fetch incidents to update the list
    });
    
    // Listen for incident deletion events
    socket.on('incident-deleted', (incidentId) => {
        console.log('Incident deleted via Socket.IO:', incidentId);
        setIncidents(prevIncidents => prevIncidents.filter(inc => inc._id !== incidentId)); // Remove from list instantly
    });


    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO backend!');
    });

    // Handle connection errors
    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        if (err.message === 'jwt expired' || err.message === 'Invalid token') {
            handleSetAuth(false); // Force logout
            console.log('Your session expired or token is invalid. Please log in again.');
        }
    });

    // Clean up event listeners when component unmounts or dependencies change
    return () => {
      socket.off('connect');
      socket.off('authenticated');
      socket.off('receive-alert');
      socket.off('new-incident');
      socket.off('incident-deleted'); // Clean up delete listener
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [isAuthenticated, handleSetAuth]); 

  // --- Function to send a rich alert (Text + Media + Targeting + Priority + Location) ---
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
            console.error("Error uploading alert media:", err.response?.data || err.message);
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
      mediaType: mediaType,
      targetRole: alertTargetRole === 'all' ? null : alertTargetRole,
      priority: alertPriority,
      locationTag: alertLocationTag 
    };

    if (socket.connected) {
        socket.emit('send-alert', alertData);
        setAlertMessage(''); 
        setAlertMediaFile(null); 
        document.getElementById('alertMediaInput').value = ''; 
        setAlertPriority('info'); 
        setAlertLocationTag(''); 
        setAlertTargetRole('all'); 
        setAlertSendSuccess('Alert Sent!');
        setTimeout(() => setAlertSendSuccess(''), 3000); 
    } else {
        setAlertSendError('Socket.IO not connected. Please check your connection.');
    }
  };

  // Backend status message (remains unchanged)
  useEffect(() => {
    axios.get('http://localhost:5000/')
      .then(response => {
        setBackendMessage(response.data);
      })
      .catch(err => {
        console.error("Error fetching backend message:", err);
        setBackendMessage('Failed to connect to backend.');
      });
  }, []);

  // Incident fetching (triggered on isAuthenticated change or new-incident socket event)
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentsError(null);
    try {
      const token = localStorage.getItem('token'); 
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const res = await axios.get(`${API_BASE_URL}/incidents`, config);
      setIncidents(res.data);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setIncidentsError("Failed to load incidents. Please try again.");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchIncidents();
    }
  }, [isAuthenticated]);

  // Add Incident (UPDATED for media attachment)
  const handleAddIncident = async (e) => {
    e.preventDefault();
    setIncidentsError(null); // Clear errors

    let imageUrl = null;
    if (newIncidentMediaFile) { // If a media file is selected, upload it first
        try {
            const formData = new FormData();
            formData.append('alertMedia', newIncidentMediaFile); // IMPORTANT: Field name MUST match backend's uploadMediaToDisk.single('alertMedia')

            const uploadRes = await axios.post(`${API_BASE_URL}/alert-media-upload`, formData, { // Reusing alert media upload route
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            imageUrl = `http://localhost:5000${uploadRes.data.mediaUrl}`; // Get the full URL
        } catch (err) {
            console.error("Error uploading incident media:", err.response?.data || err.message);
            setIncidentsError(`Failed to upload incident media: ${err.response?.data?.message || err.message}`);
            return; // Stop if upload fails
        }
    }

    try {
      const token = localStorage.getItem('token'); 
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const response = await axios.post(`${API_BASE_URL}/incidents`, {
        type: newIncidentType,
        location: newIncidentLocation,
        imageUrl: imageUrl // Pass the uploaded image URL
      }, config);
      console.log('Incident added:', response.data);
      setNewIncidentType('');
      setNewIncidentLocation('');
      setNewIncidentMediaFile(null); // Clear file state
      document.getElementById('incidentMediaInput').value = ''; // Clear file input visually
    } catch (err) {
      console.error("Error adding incident:", err);
      setIncidentsError("Failed to add incident. Please try again.");
    }
  };

  // NEW: handleDeleteIncident function (FIX for delete button)
  const handleDeleteIncident = async (incidentId) => {
    try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { 'x-auth-token': token } } : {};
        await axios.delete(`${API_BASE_URL}/incidents/${incidentId}`, config);
        console.log('Incident deleted:', incidentId);
        // The Socket.IO 'incident-deleted' event will automatically update the list now
        // setIncidents(prevIncidents => prevIncidents.filter(inc => inc._id !== incidentId)); // No need to filter manually
    } catch (err) {
        console.error("Error deleting incident:", err);
        setIncidentsError("Failed to delete incident. Please try again.");
    }
  };


  // AI Image Analysis (Manual Upload) (remains unchanged)
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
      setAiAnalysisError("Please select an image to analyze.");
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
      console.log("AI Analysis Response:", response.data);
    } catch (err) {
      console.error("Error during AI image analysis:", err);
      if (err.response) {
        setAiAnalysisError(`AI Service Error: ${err.response.data.message || err.response.statusText}`);
      } else if (err.request) {
        setAiAnalysisError("No response from AI Service. Is the backend and Python service running?");
      } else {
        setAiAnalysisError(`Analysis failed: ${err.message}`);
      }
      setAiDetections([]);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Canvas Drawing Effect (unchanged)
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

      aiDetections.forEach(detection => {
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


  // Main Dashboard View (Authenticated)
  return (
    <div className="App">
      <header className="App-header">
        <h1>EventGuard Safety Dashboard</h1>
        <p>Backend Status: {backendMessage}</p>
        <div className="user-info">
            <span>Welcome, {username} ({userRole})</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
        <nav className="main-nav">
            <Link to="/" className="nav-link">Main Dashboard</Link>
            {userRole === 'head' && (
                <Link to="/head-dashboard" className="nav-link">User Approvals</Link>
            )}
        </nav>
      </header>

      <Routes> {/* Routes nested within AppContent for authenticated views */}
        <Route path="/" element={
          <>
            <section className="section-card">
              <h2>Send Alert</h2>
              <form onSubmit={handleSendAlert} className="send-alert-form">
                <div className="form-group">
                  <label htmlFor="alertMessage">Message:</label>
                  <input
                    type="text"
                    id="alertMessage"
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="Type your alert message..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="alertMediaInput">Attach Media (Image, Video, Audio):</label>
                  <input
                    type="file"
                    id="alertMediaInput"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => setAlertMediaFile(e.target.files[0])}
                  />
                </div>
                <div className="form-group">
                    <label htmlFor="alertTargetRole">Send to:</label>
                    <select
                        id="alertTargetRole"
                        value={alertTargetRole}
                        onChange={(e) => setAlertTargetRole(e.target.value)}
                        className="role-select"
                    >
                        <option value="all">All Members</option>
                        <option value="head">Heads Only</option>
                        <option value="room">Security Room Only</option>
                        <option value="ground">On-Ground Only</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="alertPriority">Priority:</label>
                    <select
                        id="alertPriority"
                        value={alertPriority}
                        onChange={(e) => setAlertPriority(e.target.value)}
                        className="role-select"
                    >
                        <option value="info">Info</option>
                        <option value="important">Important</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="alertLocationTag">Location Tag:</label>
                    <input
                        type="text"
                        id="alertLocationTag"
                        value={alertLocationTag}
                        onChange={(e) => setAlertLocationTag(e.target.value)}
                        placeholder="e.g., Main Stage Left, Gate C"
                    />
                </div>
                <button type="submit" className="button-primary">Send Alert</button>
              </form>
              {alertSendSuccess && <p className="success-message">{alertSendSuccess}</p>}
              {alertSendError && <p className="error-message">{alertSendError}</p>}
            </section>

            <section className="section-card">
              <h2>Real-time Alerts Feed</h2>
              <div className="alerts-display">
                  {realtimeAlerts.length === 0 ? (
                      <p>No real-time alerts yet.</p>
                  ) : (
                      <ul>
                          {realtimeAlerts.map((alert, index) => (
                              <li key={index} className={`alert-item alert-priority-${alert.priority || 'info'}`}>
                                  <strong>ALERT:</strong> {alert.message} <br />
                                  From: {alert.sender} ({alert.senderRole})
                                  {alert.locationTag && <span> at {alert.locationTag}</span>}
                                  <br/>
                                  Time: {new Date(alert.timestamp).toLocaleTimeString()}
                                  {alert.targetRole && <span className="alert-target-badge"> &gt; {alert.targetRole.toUpperCase()}</span>}
                                  {alert.priority && <span className={`alert-priority-badge alert-priority-${alert.priority}`}> {alert.priority.toUpperCase()}</span>}
                                  {alert.mediaUrl && (
                                      <div className="alert-media">
                                          {alert.mediaType === 'image' && <img src={alert.mediaUrl} alt="Alert Media" />}
                                          {alert.mediaType === 'video' && <video controls src={alert.mediaUrl}></video>}
                                          {alert.mediaType === 'audio' && <audio controls src={alert.mediaUrl}></audio>}
                                          <p><a href={alert.mediaUrl} target="_blank" rel="noopener noreferrer">View Media</a></p>
                                      </div>
                                  )}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
            </section>

            <section className="section-card">
              <h2>Add New Incident</h2>
              <form onSubmit={handleAddIncident} className="add-incident-form">
                <div className="form-group">
                  <label htmlFor="incidentType">Incident Type:</label>
                  <input
                    type="text"
                    id="incidentType"
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="incidentLocation">Location:</label>
                  <input
                    type="text"
                    id="incidentLocation"
                    value={newIncidentLocation}
                    onChange={(e) => setNewIncidentLocation(e.target.value)}
                    required
                  />
                </div>
                {/* NEW: Incident Media Input */}
                <div className="form-group">
                    <label htmlFor="incidentMediaInput">Attach Image for Incident (Optional):</label>
                    <input
                        type="file"
                        id="incidentMediaInput"
                        accept="image/*"
                        onChange={(e) => setNewIncidentMediaFile(e.target.files[0])}
                    />
                </div>
                <button type="submit" className="button-primary">Add Incident</button>
              </form>
              {incidentsError && <p className="error-message">{incidentsError}</p>}
            </section>

            <section className="section-card">
              <h2>AI Image Analysis (Manual Upload)</h2>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <button onClick={handleAnalyzeImage} disabled={aiAnalysisLoading || !selectedImage} className="button-accent">
                {aiAnalysisLoading ? 'Analyzing...' : 'Analyze Image with AI'}
              </button>
              {aiAnalysisError && <p className="error-message">{aiAnalysisError}</p>}

              {imagePreviewUrl && (
                <div className="image-analysis-container">
                  <h3>Detected Objects:</h3>
                  <canvas ref={canvasRef} className="image-canvas"></canvas>
                  {aiDetections.length > 0 && (
                    <div className="detections-list">
                      <h4>Raw Detections List:</h4>
                      <ul>
                        {aiDetections.map((det, index) => (
                          <li key={index}>
                            {det.className} ({(det.probability * 100).toFixed(1)}%) - Box: ({det.box.left.toFixed(0)}, {det.box.top.toFixed(0)}) to ({det.box.right.toFixed(0)}, {det.box.bottom.toFixed(0)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiDetections.length === 0 && !aiAnalysisLoading && !aiAnalysisError && selectedImage && (
                      <p>No objects detected in this image (or below confidence threshold).</p>
                  )}
                </div>
              )}
            </section>

            <section className="section-card">
              <h2>Recorded Incidents</h2>
              <button onClick={fetchIncidents} disabled={loadingIncidents} className="button-accent">
                {loadingIncidents ? 'Loading...' : 'Refresh Incidents'}
              </button>
              {loadingIncidents && <p>Loading incidents...</p>}
              {incidentsError && <p className="error-message">{incidentsError}</p>}
              {!loadingIncidents && incidents.length === 0 && !incidentsError && <p>No incidents found. Add one!</p>}
              {!loadingIncidents && incidents.length > 0 && (
                <ul>
                  {incidents.map(incident => (
                    <li key={incident._id} className="incident-list-item"> {/* Added class for potential styling */}
                      <strong>Type:</strong> {incident.type} <br />
                      <strong>Location:</strong> {incident.location} <br />
                      <strong>Time:</strong> {new Date(incident.timestamp).toLocaleString()}
                      {incident.imageUrl && ( // Display incident image if available
                          <div className="incident-image">
                              <img src={incident.imageUrl} alt="Incident Media" />
                              <p><a href={incident.imageUrl} target="_blank" rel="noopener noreferrer">View Image</a></p>
                          </div>
                      )}
                      {/* Delete Button */}
                      <button onClick={() => handleDeleteIncident(incident._id)} className="button-danger delete-incident-button">
                          Delete Incident
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        } />
        {userRole === 'head' && (
            <Route path="/head-dashboard" element={<HeadDashboard userRole={userRole} />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

// Main App component for Routing (remains the same)
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
          console.error("Failed to parse user data from localStorage", e);
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
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login setAuth={handleSetAuth} />} />

        <Route
          path="/*"
          element={isAuthenticated ? 
            <AppContent 
              isAuthenticated={isAuthenticated} 
              userRole={userRole} 
              username={username} 
              handleSetAuth={handleSetAuth} 
            /> : 
            <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;