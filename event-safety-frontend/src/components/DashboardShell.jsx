import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import SidebarMenu from './SidebarMenu';
import { socket } from '../socket';

const topBarBg = '#ffffff';
const topBarTextColor = '#333';
const sidebarWidth = 220;
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function DashboardShell({ children, title, userRole: propUserRole, username: propUsername }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [approvalsPending, setApprovalsPending] = useState(0);
  const [meetingsPending, setMeetingsPending] = useState(0);
  const [myTeam, setMyTeam] = useState(null);
  const [hideTopBar, setHideTopBar] = useState(false);
  const [incidentsPending, setIncidentsPending] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const { username, userRole } = useMemo(() => {
    if (propUserRole && propUsername) {
      return { username: propUsername, userRole: propUserRole };
    }
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return { username: parsed?.username || '', userRole: parsed?.role || '' };
    } catch {
      return { username: '', userRole: '' };
    }
  }, [propUserRole, propUsername]);

  // Listen for Teams.jsx signalling its create/edit dialog is open —
  // hides this top bar so it doesn't render above the dialog (z-index clash)
  useEffect(() => {
    const handleDialogToggle = (e) => {
      setHideTopBar(!!e.detail?.open);
    };
    window.addEventListener('teams-dialog-toggle', handleDialogToggle);
    return () => window.removeEventListener('teams-dialog-toggle', handleDialogToggle);
  }, []);

  const refreshChatUnread = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios
      .get(`${API_BASE_URL}/chat/unread-summary`, { headers: { 'x-auth-token': token } })
      .then((res) => setChatUnread(res.data?.total || 0))
      .catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const config = { headers: { 'x-auth-token': token } };

    const refreshBadges = async () => {
      try {
        const meetingsRes = await axios.get(`${API_BASE_URL}/meetings`, config);
        if (isMounted) {
          const now = Date.now();
          const upcoming = (meetingsRes.data || []).filter(
            (m) => new Date(m.meetingTime).getTime() >= now
          );
          setMeetingsPending(upcoming.length);
        }
      } catch {
        // non-critical
      }

      try {
        const incidentSummaryRes = await axios.get(`${API_BASE_URL}/incident-reports/summary`, config);
        if (isMounted) {
          setIncidentsPending(incidentSummaryRes.data?.pending || 0);
        }
      } catch {
        // non-critical
      }

      try {
        const chatRes = await axios.get(`${API_BASE_URL}/chat/unread-summary`, config);
        if (isMounted) {
          setChatUnread(chatRes.data?.total || 0);
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

      try {
        const myTeamRes = await axios.get(`${API_BASE_URL}/teams/my-team`, config);
        if (isMounted) {
          setMyTeam(myTeamRes.data);
        }
      } catch {
        // non-critical
      }
    };

    refreshBadges();

    const handleNewMeeting = () => {
      setMeetingsPending((prev) => prev + 1);
    };
    const handleMeetingDeleted = () => {
      setMeetingsPending((prev) => (prev > 0 ? prev - 1 : 0));
    };
    const handleIncidentUpdate = () => {
      const t = localStorage.getItem('token');
      if (!t) return;
      axios
        .get(`${API_BASE_URL}/incident-reports/summary`, { headers: { 'x-auth-token': t } })
        .then((res) => setIncidentsPending(res.data?.pending || 0))
        .catch(() => {});
    };
    const handleChatUnreadUpdate = () => {
      refreshChatUnread();
    };
    const handleChatBadgeRefresh = () => {
      refreshChatUnread();
    };

    socket.on('new-meeting', handleNewMeeting);
    socket.on('meeting-deleted', handleMeetingDeleted);
    socket.on('incident-case-created', handleIncidentUpdate);
    socket.on('incident-case-updated', handleIncidentUpdate);
    socket.on('incident-assigned', handleIncidentUpdate);
    socket.on('chat-unread-update', handleChatUnreadUpdate);
    socket.on('receive-chat-message', handleChatUnreadUpdate);
    window.addEventListener('chat-badge-refresh', handleChatBadgeRefresh);

    return () => {
      isMounted = false;
      socket.off('new-meeting', handleNewMeeting);
      socket.off('meeting-deleted', handleMeetingDeleted);
      socket.off('incident-case-created', handleIncidentUpdate);
      socket.off('incident-case-updated', handleIncidentUpdate);
      socket.off('incident-assigned', handleIncidentUpdate);
      socket.off('chat-unread-update', handleChatUnreadUpdate);
      socket.off('receive-chat-message', handleChatUnreadUpdate);
      window.removeEventListener('chat-badge-refresh', handleChatBadgeRefresh);
    };
  }, [userRole]);

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  const handleLogout = () => {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    localStorage.clear();
    window.location.href = '/';
  };

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
        meetingsPending={meetingsPending}
        incidentsPending={incidentsPending}
        chatUnread={chatUnread}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        onLogout={handleLogout}
      />

      {!hideTopBar && (
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
      )}

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
        {!hideTopBar && (
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
        )}

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
            mt: hideTopBar ? 0 : { xs: '116px', sm: '108px', md: '72px' },
            minHeight: hideTopBar ? '100vh' : { xs: 'calc(100vh - 116px)', md: 'calc(100vh - 72px)' },
          }}
          role="main"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}