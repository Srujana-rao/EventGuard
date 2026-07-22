import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Avatar,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  MenuItem,
} from '@mui/material';
import { useThemeMode } from '../ThemeModeContext';

const sections = ['Profile', 'Notifications', 'Appearance', 'Account'];

function ProfileSection({ onProfileUpdate }) {
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const [name, setName] = useState(storedUser.username || '');
  const [email, setEmail] = useState(storedUser.email || '');
  const [selectedRole, setSelectedRole] = useState(storedUser.role || 'ground');
  const [pendingRole, setPendingRole] = useState(null);
  const [roleChangeStatus, setRoleChangeStatus] = useState('none');
  const [avatarPreview, setAvatarPreview] = useState(
    localStorage.getItem('profileAvatar') || ''
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { 'x-auth-token': token },
        });
        setPendingRole(res.data.pendingRole || null);
        setRoleChangeStatus(res.data.roleChangeStatus || 'none');
      } catch {
        // non-critical — settings page still usable without this
      }
    };
    fetchMe();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const updatedUser = {
      ...storedUser,
      username: name,
      email,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (avatarPreview) {
      localStorage.setItem('profileAvatar', avatarPreview);
    }
    if (onProfileUpdate) {
      onProfileUpdate(updatedUser);
    }

    if (selectedRole !== storedUser.role) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/auth/request-role-change',
          { role: selectedRole },
          { headers: { 'x-auth-token': token } }
        );
        setPendingRole(selectedRole);
        setRoleChangeStatus('pending');
        setMessage('Waiting for head approval.');
      } catch (err) {
        setMessage(err.response?.data?.msg || 'Failed to request role change.');
      }
    }

    setTimeout(() => setSaving(false), 300);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Profile
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          src={avatarPreview || undefined}
          sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
        >
          {(!avatarPreview && name && name[0]?.toUpperCase()) || ''}
        </Avatar>
        <Button variant="outlined" component="label">
          Upload picture
          <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
        </Button>
      </Box>
      <TextField
        label="Name"
        fullWidth
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        select
        label="Organization / Role"
        fullWidth
        margin="normal"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        disabled={roleChangeStatus === 'pending'}
      >
        <MenuItem value="room">Room</MenuItem>
        <MenuItem value="ground">Ground</MenuItem>
      </TextField>

      {roleChangeStatus === 'pending' && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          Waiting for head approval (requested: {pendingRole})
        </Typography>
      )}
      {message && roleChangeStatus !== 'pending' && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </Box>
  );
}

function NotificationsSection() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [meetingNotifs, setMeetingNotifs] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('notificationPrefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        setEmailNotifs(!!parsed.email);
        setSystemAlerts(!!parsed.system);
        setMeetingNotifs(!!parsed.meetings);
      }
    } catch {
      // ignore
    }
  }, []);

  const savePrefs = (next) => {
    localStorage.setItem('notificationPrefs', JSON.stringify(next));
  };

  const handleToggleEmail = (checked) => {
    setEmailNotifs(checked);
    savePrefs({ email: checked, system: systemAlerts, meetings: meetingNotifs });
  };

  const handleToggleSystem = (checked) => {
    setSystemAlerts(checked);
    savePrefs({ emailNotifs, system: checked, meetings: meetingNotifs });
  };

  const handleToggleMeetings = (checked) => {
    setMeetingNotifs(checked);
    savePrefs({ email: emailNotifs, system: systemAlerts, meetings: checked });
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Notifications
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={emailNotifs}
            onChange={(e) => handleToggleEmail(e.target.checked)}
          />
        }
        label="Email notifications"
      />
      <Box />
      <FormControlLabel
        control={
          <Switch
            checked={systemAlerts}
            onChange={(e) => handleToggleSystem(e.target.checked)}
          />
        }
        label="System alerts"
      />
      <Box />
      <FormControlLabel
        control={
          <Switch
            checked={meetingNotifs}
            onChange={(e) => handleToggleMeetings(e.target.checked)}
          />
        }
        label="Meeting notifications"
      />
    </Box>
  );
}

function AppearanceSection() {
  const { preference, setMode } = useThemeMode();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Appearance
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Choose how the dashboard should look.
      </Typography>
      <RadioGroup
        value={preference}
        onChange={(e) => setMode(e.target.value)}
        name="theme-selection"
      >
        <FormControlLabel value="light" control={<Radio />} label="Light" />
        <FormControlLabel value="dark" control={<Radio />} label="Dark" />
        <FormControlLabel value="system" control={<Radio />} label="System" />
      </RadioGroup>
    </Box>
  );
}

function AccountSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChangePassword = () => {
    window.location.href = '/forgot-password';
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    localStorage.clear();
    setConfirmOpen(false);
    window.location.href = '/';
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Account
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mt: 2,
        }}
      >
        <Button variant="outlined" size="medium" onClick={handleChangePassword}>
          Change password
        </Button>
        <Button variant="outlined" size="medium" onClick={handleLogout}>
          Logout
        </Button>
        <Button variant="outlined" size="medium" color="error" onClick={handleDelete}>
          Delete account
        </Button>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove your local data and log you out. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState('Profile');

  const renderSection = () => {
    switch (activeSection) {
      case 'Profile':
        return <ProfileSection />;
      case 'Notifications':
        return <NotificationsSection />;
      case 'Appearance':
        return <AppearanceSection />;
      case 'Account':
        return <AccountSection />;
      default:
        return null;
    }
  };

  return (
    <Paper elevation={4} sx={{ p: 0, borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
          minHeight: 360,
        }}
      >
        <Box
          sx={{
            borderRight: { xs: 'none', md: '1px solid #e0e0e0' },
            borderBottom: { xs: '1px solid #e0e0e0', md: 'none' },
            bgcolor: '#f9fafb',
          }}
        >
          <Tabs
            orientation={window.innerWidth < 900 ? 'horizontal' : 'vertical'}
            value={sections.indexOf(activeSection)}
            onChange={(_e, idx) => setActiveSection(sections[idx])}
            variant="fullWidth"
          >
            {sections.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ p: 4 }}>{renderSection()}</Box>
      </Box>
    </Paper>
  );
}