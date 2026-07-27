import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
import Groups2Icon from '@mui/icons-material/Groups2';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';


const sidebarGradient = 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)';
const sidebarWidth = 220;

export default function SidebarMenu({
  userRole,
  approvalsPending = 0,
  meetingsPending = 0,
  incidentsPending = 0,
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
  const matchTeams = location.pathname === '/teams';
  const matchIncidents = location.pathname === '/incidents';

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
  label: 'Incidents',
  to: '/incidents',
  icon: <ReportProblemIcon />,
  showBadge: incidentsPending > 0,
  badgeContent: incidentsPending,
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
      showBadge: meetingsPending > 0,
      badgeContent: meetingsPending,
      active: matchMeetings,
    },
    {
      label: 'Teams',
      to: '/teams',
      icon: <Groups2Icon />,
      showBadge: false,
      badgeContent: null,
      active: matchTeams,
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

  const nonHeadButtons = [
  {
    label: 'Main Dashboard',
    to: '/dashboard',
    icon: <NotificationsActiveIcon />,
    showBadge: false,
    badgeContent: null,
    active: matchDashboard,
  },
  {
  label: 'Incidents',
  to: '/incidents',
  icon: <ReportProblemIcon />,
  showBadge: incidentsPending > 0,
  badgeContent: incidentsPending,
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
    showBadge: meetingsPending > 0,
    badgeContent: meetingsPending,
    active: matchMeetings,
  },
  {
    label: 'Teams',
    to: '/teams',
    icon: <Groups2Icon />,
    showBadge: false,
    badgeContent: null,
    active: matchTeams,
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

  const buttons = userRole === 'head' ? headButtons : nonHeadButtons;

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