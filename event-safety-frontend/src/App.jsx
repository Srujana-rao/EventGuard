import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Teams from './components/Teams';
import PendingApproval from './components/PendingApproval';
import SocialSuccess from './components/SocialSuccess';
import Incidents from './components/Incidents';
import Chat from './components/Chat';

// Socket.IO client instance
import { socket } from './socket';

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function AppContent({ isAuthenticated, userRole, username, handleSetAuth }) {
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [meetingNotificationCount, setMeetingNotificationCount] = useState(0);
  const [approvalsPending, setApprovalsPending] = useState(0);

  // Alert Composer State
  const [alertMessage, setAlertMessage] = useState('');
  const [alertMediaFile, setAlertMediaFile] = useState(null);
  const [alertSendError, setAlertSendError] = useState(null);
  const [alertSendSuccess, setAlertSendSuccess] = useState('');
  const [alertTargetRole, setAlertTargetRole] = useState('all'); 
  const [alertPriority, setAlertPriority] = useState('low'); 
  const [alertLocationTag, setAlertLocationTag] = useState('');

  // Working date / event name — the server-shared active date for the current
  // real calendar day. Only Head can change it (via saveWorkingDay below).
  const [workingDate, setWorkingDate] = useState(getTodayString());
  const [workingEventName, setWorkingEventName] = useState('');
  const [workingDayLoaded, setWorkingDayLoaded] = useState(false);

  // React Refs for File Inputs
  const alertMediaInputRef = useRef(null);

  const handleLogout = () => {
    handleSetAuth(false);
    socket.disconnect();
    window.location.href = '/';
  };

  // Fetch the current working day on mount, and keep it in sync via socket
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let isMounted = true;
    axios
      .get(`${API_BASE_URL}/working-day/current`, { headers: { 'x-auth-token': token } })
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setWorkingDate(res.data.workingDate);
          setWorkingEventName(res.data.eventName || '');
        }
        setWorkingDayLoaded(true);
      })
      .catch(() => {
        if (isMounted) setWorkingDayLoaded(true);
      });

    const handleWorkingDayChanged = (doc) => {
      setWorkingDate(doc.workingDate);
      setWorkingEventName(doc.eventName || '');
    };
    socket.on('working-day-changed', handleWorkingDayChanged);

    return () => {
      isMounted = false;
      socket.off('working-day-changed', handleWorkingDayChanged);
    };
  }, [isAuthenticated]);

  // Fetch persisted alerts for the active working date — runs on mount and
  // whenever the working date changes, so the feed is always in sync no
  // matter which page the user was on before, and resets automatically the
  // moment the working date rolls over to a new day.
  useEffect(() => {
    if (!isAuthenticated || !workingDayLoaded || !workingDate) return undefined;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let isMounted = true;
    axios
      .get(`${API_BASE_URL}/alerts`, {
        headers: { 'x-auth-token': token },
        params: { date: workingDate },
      })
      .then((res) => {
        if (isMounted) setRealtimeAlerts(res.data || []);
      })
      .catch(() => {
        if (isMounted) setRealtimeAlerts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, workingDate, workingDayLoaded]);

  // Head-only: persist a new working date/event name to the backend
  const saveWorkingDay = async (date, eventName) => {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `${API_BASE_URL}/working-day`,
      { workingDate: date, eventName },
      { headers: { 'x-auth-token': token } }
    );
    setWorkingDate(res.data.workingDate);
    setWorkingEventName(res.data.eventName || '');
    return res.data;
  };

  /// Socket.IO event listeners for the main dashboard (connection is managed in App)

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = token ? { headers: { 'x-auth-token': token } } : {};

    if (!token || !isAuthenticated) {
      return undefined;
    }

    const handleAuthenticated = ({ status, user }) => {
      if (status) {
        console.log(`Socket authenticated for user: ${user.username} (${user.role})`);
      } else {
        console.error('Socket authentication failed!');
      }
    };

    const handleReceiveAlert = (alertData) => {
      setRealtimeAlerts((prev) => {
        if (prev.find((a) => a._id === alertData._id)) return prev;
        return [...prev, alertData];
      });
    };

    const handleAlertDeleted = (alertId) => {
      setRealtimeAlerts((prev) => prev.filter((alert) => String(alert._id) !== String(alertId)));
    };

    const handleNewMeeting = (meeting) => {
      // Only notify if the meeting wasn't created by the current user
      if (meeting?.createdBy && meeting.createdBy === username) {
        return;
      }
      setMeetingNotificationCount((prev) => prev + 1);
    };

    const handleApprovalUpdate = async () => {
      if (userRole !== 'head') return;
      try {
        const summaryRes = await axios.get(`${API_BASE_URL}/auth/pending-summary`, config);
        setApprovalsPending(summaryRes.data?.total || 0);
      } catch {
        // non-critical
      }
    };

    const handleMeetingDeleted = () => {
      setMeetingNotificationCount((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const handleDisconnect = () => {
      console.log('Disconnected from Socket.IO backend!');
    };

    socket.on('authenticated', handleAuthenticated);
    socket.on('receive-alert', handleReceiveAlert);
    socket.on('alert-deleted', handleAlertDeleted);
    socket.on('new-meeting', handleNewMeeting);
    socket.on('pending-summary-update', handleApprovalUpdate);
    socket.on('meeting-deleted', handleMeetingDeleted);
    socket.on('disconnect', handleDisconnect);

    // Ensure socket is authenticated while viewing the dashboard
    if (socket.connected) {
      socket.emit('authenticate', token);
    }

    return () => {
      socket.off('authenticated', handleAuthenticated);
      socket.off('receive-alert', handleReceiveAlert);
      socket.off('alert-deleted', handleAlertDeleted);
      socket.off('new-meeting', handleNewMeeting);
      socket.off('pending-summary-update', handleApprovalUpdate);
      socket.off('meeting-deleted', handleMeetingDeleted);
      socket.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, username, userRole]);

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

    // NOTE: workingDate/eventName are sent as a convenience hint only — the
    // backend now always looks up the authoritative working date itself and
    // does not trust these values, so client-side staleness can't cause
    // alerts/incidents to be misfiled anymore.
    const alertData = {
      message: alertMessage.trim(),
      sender: username,
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      mediaUrl: mediaUrl
  ? `${import.meta.env.VITE_API_URL}${mediaUrl}`
  : null,
      mediaType,
      targetRole: alertTargetRole === 'all' ? null : alertTargetRole,
      priority: alertPriority,
      locationTag: alertLocationTag,
      workingDate,
      eventName: workingEventName,
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

  // Sidebar badge counts
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isMounted = true;
    const token = localStorage.getItem('token');
    const config = token ? { headers: { 'x-auth-token': token } } : {};

    const loadBadgeCounts = async () => {
      try {
        const meetingsRes = await axios.get(`${API_BASE_URL}/meetings`, config);
        if (isMounted) {
          const now = Date.now();
          const upcoming = (meetingsRes.data || []).filter(
            (m) => new Date(m.meetingTime).getTime() >= now
          );
          setMeetingNotificationCount(upcoming.length);
        }
      } catch {
        // non-critical
      }

      if (userRole === 'head') {
        try {
          const summaryRes = await axios.get(`${API_BASE_URL}/auth/pending-summary`, config);
          if (isMounted) {
            setApprovalsPending(summaryRes.data?.total || 0);
          }
        } catch {
          // non-critical
        }
      }
    };

    loadBadgeCounts();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userRole]);

  return (
    <Dashboard
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
      alertMediaInputRef={alertMediaInputRef}
      approvalsPending={approvalsPending}
      meetingNotificationCount={meetingNotificationCount}
      workingDate={workingDate}
      workingEventName={workingEventName}
      workingDayLoaded={workingDayLoaded}
      saveWorkingDay={saveWorkingDay}
    />
  );
}

// Main App component for Routing
function getStoredAuth() {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || token === 'undefined' || token === 'null' || !user) {
      return { isAuthenticated: false, userRole: null, username: null };
    }
    const parsedUser = JSON.parse(user);
    axios.defaults.headers.common['x-auth-token'] = token;
    return {
      isAuthenticated: true,
      userRole: parsedUser.role || null,
      username: parsedUser.username || null,
    };
  } catch {
    return { isAuthenticated: false, userRole: null, username: null };
  }
}

function App() {
  const initialAuth = getStoredAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated);
  const [userRole, setUserRole] = useState(initialAuth.userRole);
  const [username, setUsername] = useState(initialAuth.username);

  const handleProfileUpdate = (updatedUser) => {
    if (!updatedUser) return;
    const nextUser = {
      ...JSON.parse(localStorage.getItem('user') || '{}'),
      ...updatedUser,
    };
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUsername(nextUser.username || null);
    setUserRole(nextUser.role || userRole);
    if (nextUser.role) {
      setUserRole(nextUser.role);
    }
  };

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
    const stored = getStoredAuth();
    setIsAuthenticated(stored.isAuthenticated);
    setUserRole(stored.userRole);
    setUsername(stored.username);
  }, []);

  // Keep socket connected/authenticated on every protected page (not only /dashboard)
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket.connected) {
        socket.disconnect();
      }
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const handleConnect = () => {
      socket.emit('authenticate', token);
    };

    socket.on('connect', handleConnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit('authenticate', token);
    }

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup setAuth={handleSetAuth} />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/login" element={<Login setAuth={handleSetAuth} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/social-success" element={<SocialSuccess setAuth={handleSetAuth} />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/head-dashboard"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : userRole === 'head' ? (
              <DashboardShell title="User Approvals" userRole={userRole} username={username}>
                <HeadDashboard userRole={userRole} />
              </DashboardShell>
            ) : (
              <Navigate to="/dashboard" replace />
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
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/staff-info"
          element={
            isAuthenticated ? (
              <DashboardShell title="Staff Info" userRole={userRole} username={username}>
                <StaffInfo />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/meetings"
          element={
            isAuthenticated ? (
              <DashboardShell title="Meetings" userRole={userRole} username={username}>
                <Meetings userRole={userRole} />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <DashboardShell title="Settings" userRole={userRole} username={username}>
                <Settings onProfileUpdate={handleProfileUpdate} />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/teams"
          element={
            isAuthenticated ? (
              <DashboardShell title="Teams" userRole={userRole} username={username}>
                <Teams userRole={userRole} />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/incidents"
          element={
            isAuthenticated ? (
              <DashboardShell title="Incidents" userRole={userRole} username={username}>
                <Incidents userRole={userRole} />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
  path="/chat"
  element={
    isAuthenticated ? (
      <DashboardShell title="Chat" userRole={userRole} username={username}>
        <Chat />
      </DashboardShell>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
      </Routes>
    </Router>
  );
}

export default App;