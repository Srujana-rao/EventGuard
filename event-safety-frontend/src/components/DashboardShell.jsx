import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GroupsIcon from '@mui/icons-material/Groups';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import { socket } from '../socket';

const sidebarGradient = 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)';
const topBarBg = '#ffffff';
const topBarTextColor = '#333';
const sidebarWidth = 220;
const API_BASE_URL = 'http://localhost:5000/api';

function SidebarMenu({
  userRole,
  approvalsPending,
  meetingsPending,
  mobileOpen,
  onDrawerToggle,
  onLogout,
}) {
  const location = useLocation();
  const matchDashboard = location.pathname === '/dashboard';
  const matchStaffInfo = location.pathname === '/staff-info';
  const matchMeetings = location.pathname === '/meetings';
  const matchHeadDashboard = location.pathname === '/head-dashboard';
  const matchSettings = location.pathname === '/settings';

  const headButtons = [
    {
      label: 'User Approvals',
      to: '/head-dashboard',
      icon: <AdminPanelSettingsIcon />,
      showBadge: approvalsPending > 0,
      badgeContent: approvalsPending,
      active: matchHeadDashboard,
    },
    {
      label: 'Main Dashboard',
      to: '/dashboard',
      icon: <NotificationsActiveIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchDashboard,
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
      showBadge: meetingsPending > 0,
      badgeContent: meetingsPending,
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

  const buttons = userRole === 'head' ? headButtons : [
    {
      label: 'Main Dashboard',
      to: '/dashboard',
      icon: <NotificationsActiveIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchDashboard,
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
      showBadge: meetingsPending > 0,
      badgeContent: meetingsPending,
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

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
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
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.18)' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                }}
                onClick={onDrawerToggle}
                aria-label={`Go to ${label}`}
              >
                <ListItemIcon sx={{ color: 'white' }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
                {showBadge && badgeContent > 0 && (
                  <Badge
                    badgeContent={badgeContent}
                    max={99}
                    sx={{
                      mr: 2,
                      '& .MuiBadge-badge': {
                        bgcolor: '#ffffff',
                        color: '#667eea',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                        px: 0.5,
                      },
                    }}
                  />
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
                fontSize: 15,
                textTransform: 'none',
                width: '100%',
                backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'inherit',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                whiteSpace: 'nowrap',
                minHeight: 40,
                px: 1,
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={`Go to ${label}`}
            >
              {icon}
              <span style={{ flexGrow: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
              {showBadge && badgeContent > 0 && (
                <Chip
                  label={badgeContent > 99 ? '99+' : badgeContent}
                  size="small"
                  sx={{
                    ml: 'auto',
                    height: 18,
                    minWidth: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: '#ffffff',
                    color: '#667eea',
                    flexShrink: 0,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                  aria-label={`${badgeContent} notifications`}
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

export default function DashboardShell({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [approvalsPending, setApprovalsPending] = useState(0);
  const [meetingsPending, setMeetingsPending] = useState(0);

  const { username, userRole } = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return { username: parsed?.username || '', userRole: parsed?.role || '' };
    } catch {
      return { username: '', userRole: '' };
    }
  }, []);

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

    refreshBadges();

    const handleNewMeeting = () => {
      setMeetingsPending((prev) => prev + 1);
    };
    const handleMeetingDeleted = () => {
      setMeetingsPending((prev) => (prev > 0 ? prev - 1 : 0));
    };

    socket.on('new-meeting', handleNewMeeting);
    socket.on('meeting-deleted', handleMeetingDeleted);

    return () => {
      isMounted = false;
      socket.off('new-meeting', handleNewMeeting);
      socket.off('meeting-deleted', handleMeetingDeleted);
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
            <Typography
  variant="h6"
  sx={{ fontWeight: 600, color: '#667eea' }}
  aria-live="polite"
>
  Welcome, {username} ({userRole.charAt(0).toUpperCase() + userRole.slice(1)})
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
          {children}
        </Box>
      </Box>
    </Box>
  );
}
