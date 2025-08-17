import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import {
  Security,
  NotificationsActive,
  Group,
  Speed,
  Shield,
} from '@mui/icons-material';

export default function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Real-time Security',
      description:
        'Get instant alerts for any security incident or emergency.',
    },
    {
      icon: <NotificationsActive sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Smart Alert System',
      description:
        'Smart AI auto-detects incidents and notifies the right people.',
    },
    {
      icon: <Group sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Team Coordination',
      description:
        'Ground, room, and head staff stay instantly connected.',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Rapid Response',
      description:
        'Quick reporting and instant action to ensure safety.',
    },
    {
      icon: <Shield sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Event Protection',
      description:
        'Complete security and incident management for all events.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Security sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background:
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EventGuard
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleLogin}
              size="medium"
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                px: 3,
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={handleSignup}
              size="medium"
              sx={{
                background:
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 3,
                py: 1,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          pt: 12,
          minHeight: '90vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)',
            backgroundSize: '50px 50px',
          }}
        />

        <Container maxWidth={false} sx={{ px: 6, position: 'relative' }}>
          <Box sx={{ maxWidth: '600px' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: 'white',
                mb: 3,
                fontSize: isMobile ? '2rem' : '2.8rem',
                lineHeight: 1.2,
                textAlign: 'left',
                marginLeft: 3
              }}
            >
              Secure Your Events with
              <Box
                component="span"
                sx={{
                  display: 'block',
                  background:
                    'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EventGuard
              </Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                fontWeight: 400,
                lineHeight: 1.6,
                textAlign: 'left',
                marginLeft: 3
              }}
            >
              The ultimate event security platform that combines AI-powered
              incident detection, real-time alerts, and seamless team
              coordination to keep your events safe and secure.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="medium"
                onClick={handleSignup}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  
                  background:
                    'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  color: '#333',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #ffed4e 0%, #ffd700 100%)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                  marginLeft: 3
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>

          {/* Bigger Purple Floating Component */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '5%',
              transform: 'translateY(-50%)',
              width: '230px',
              height: '230px',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            <Security sx={{ fontSize: 90, color: 'rgba(255, 255, 255, 0.9)' }} />
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Why Choose EventGuard?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#666', maxWidth: '600px', mx: 'auto' }}
            >
              Our comprehensive security platform provides everything you need
              to protect your events and ensure the safety of all attendees.
            </Typography>
          </Box>

          {/* Two per row layout, equal height */}
          <Grid container spacing={4} justifyContent="center">
            {features.map((feature, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={index}
                display="flex"
                justifyContent={index === 4 ? "center" : "flex-start"}
              >
                <Card
                  sx={{
                    width: '100%',
                    maxWidth: 350,
                    minHeight: 220,
                    height: 220,
                    textAlign: 'center',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    mx: 'auto',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      flexGrow: 1,
                    }}
                  >
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#666', fontSize: '0.97rem' }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 7,
          background: 'linear-gradient(135deg, #333 0%, #555 100%)',
          color: 'white',
        }}
      >
        <Container maxWidth={false} sx={{ px: 4 }}>
          <Box textAlign="center">
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Ready to Secure Your Next Event?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Join thousands of event organizers who trust EventGuard to keep
              their events safe and secure.
            </Typography>
            <Button
              variant="contained"
              onClick={handleSignup}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 600,
                background:
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 3,
          backgroundColor: '#222',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth={false} sx={{ px: 4 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © 2024 EventGuard. All rights reserved. | Secure. Smart. Reliable.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
