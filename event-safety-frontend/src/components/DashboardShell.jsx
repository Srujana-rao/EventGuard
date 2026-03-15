import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { socket } from '../socket';

const darkBlue = '#0f172a';
const sidebarWidth = 220;

function SidebarMenu({ userRole, approvalsPending, mobileOpen, onDrawerToggle, onLogout }) {
  const location = useLocation();
  const matchDashboard = location.pathname === '/dashboard';
  const matchStaffInfo = location.pathname === '/staff-info';
  const matchMeetings = location.pathname === '/meetings';
  const matchHeadDashboard = location.pathname === '/head-dashboard';
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
      label: 'Staff Info',
      to: '/staff-info',
      icon: <AdminPanelSettingsIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchStaffInfo,
    },
    {
      label: 'Meetings',
      to: '/meetings',
      icon: <AddCircleOutlineIcon />,
      showBadge: false,
      badgeContent: null,
      active: matchMeetings,
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: <AdminPanelSettingsIcon />,
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
        ModalProps={{ keepMounted: true }}
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
        <List sx={{ mt: 6 }}>
          {buttons.map(({ label, to, icon, showBadge, badgeContent, active }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
                component={Link}
                to={to}
                selected={active}
                sx={{
                  color: 'white',
                  '&.Mui-selected': { bgcolor: '#3951a3' },
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
              sx={{ fontWeight: 700, bgcolor: '#397ebaff', ':hover': { bgcolor: '#0a335a' } }}
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
                '&:hover': { backgroundColor: '#3951a3' },
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

export default function DashboardShell({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { username, userRole } = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return { username: parsed?.username || '', userRole: parsed?.role || '' };
    } catch {
      return { username: '', userRole: '' };
    }
  }, []);

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
        width: '100vw',
        bgcolor: '#f0f2f5',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <SidebarMenu
        userRole={userRole}
        approvalsPending={0}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        onLogout={handleLogout}
      />

      {/* Mobile top bar */}
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
        {/* Header */}
        <Box
          sx={{
            width: '100%',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkBlue,
            color: 'white',
            px: 4,
            position: 'fixed',
            top: { xs: 64, md: 0 },
            left: 0,
            right: 0,
            zIndex: 1350,
            boxShadow: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.6,
                lineHeight: 1.1,
              }}
            >
              EventGuard
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.92, mt: 0.3 }}
              aria-live="polite"
            >
              {title || `Welcome, ${username} (${userRole})`}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
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

