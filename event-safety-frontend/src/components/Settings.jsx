import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Avatar,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  MenuItem,
  Slider,
  CircularProgress,
} from '@mui/material';

const sections = ['Profile', 'Notifications', 'Account'];

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

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
  const [currentRole, setCurrentRole] = useState(storedUser.role || 'ground');
  const [selectedRole, setSelectedRole] = useState(storedUser.role || 'ground');
  const [pendingRole, setPendingRole] = useState(null);
  const [roleChangeStatus, setRoleChangeStatus] = useState('none');
  const isHead = (storedUser.role || currentRole) === 'head';
  const [avatarPreview, setAvatarPreview] = useState(
    localStorage.getItem('profileAvatar') || ''
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Crop dialog state
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { 'x-auth-token': token },
        });

        const serverRole = res.data.role || storedUser.role || 'ground';
        const status = res.data.roleChangeStatus || 'none';
        const serverEmail = res.data.email || storedUser.email || '';

        // Always keep the actual role from the server — never treat pendingRole as active.
        setCurrentRole(serverRole);
        setSelectedRole(serverRole);
        setPendingRole(status === 'pending' ? res.data.pendingRole || null : null);
        setRoleChangeStatus(status === 'pending' ? 'pending' : status === 'rejected' ? 'none' : status);
        setEmail(serverEmail);

        const syncedUser = {
          ...storedUser,
          username: res.data.username || storedUser.username,
          email: serverEmail,
          role: serverRole,
        };
        localStorage.setItem('user', JSON.stringify(syncedUser));
      } catch {
        // non-critical — settings page still usable without this
      }
    };
    fetchMe();
  }, [storedUser]);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImage(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setCropping(true);
    try {
      const cropped = await getCroppedImg(rawImage, croppedAreaPixels);
      setAvatarPreview(cropped);
      setCropOpen(false);
      setRawImage('');
    } catch {
      setMessage('Failed to process image. Please try again.');
    } finally {
      setCropping(false);
    }
  };

  const handleCancelCrop = () => {
    setCropOpen(false);
    setRawImage('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDeletePicture = () => {
    setAvatarPreview('');
    localStorage.removeItem('profileAvatar');
    setMessage('Profile picture removed.');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        username: name.trim(),
        email: email.trim().toLowerCase(),
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, payload, {
        headers: { 'x-auth-token': token },
      });

      const serverUser = res.data?.user || {};
      const updatedUser = {
        ...storedUser,
        username: serverUser.username || name.trim(),
        email: serverUser.email || email.trim().toLowerCase(),
        role: currentRole,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (avatarPreview) {
        localStorage.setItem('profileAvatar', avatarPreview);
      } else {
        localStorage.removeItem('profileAvatar');
      }
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }

      if (!isHead && selectedRole !== currentRole) {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/auth/request-role-change`,
            { role: selectedRole },
            { headers: { 'x-auth-token': token } }
          );
          setPendingRole(selectedRole);
          setRoleChangeStatus('pending');
          setSelectedRole(currentRole);
          setMessage('Profile saved and role change requested. Waiting for Head approval — your current role is unchanged.');
        } catch (err) {
          setSelectedRole(currentRole);
          setMessage(err.response?.data?.msg || 'Profile saved, but role change failed.');
        }
      } else {
        setMessage('Profile saved.');
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to save profile.');
    } finally {
      setTimeout(() => setSaving(false), 300);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Profile
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Avatar
          src={avatarPreview || undefined}
          sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
        >
          {(!avatarPreview && name && name[0]?.toUpperCase()) || ''}
        </Avatar>
        <Button variant="outlined" component="label">
          Upload Picture
          <input type="file" hidden accept="image/*" onChange={handleAvatarSelect} />
        </Button>
        {avatarPreview && (
          <Button variant="outlined" color="error" onClick={handleDeletePicture}>
            Delete Picture
          </Button>
        )}
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

      {!isHead && (
        <>
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
              Waiting for Head approval (Requested: {pendingRole}). Your current
              role ({currentRole}) stays active until approved.
            </Typography>
          )}
        </>
      )}

      {message && (
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

      <Dialog open={cropOpen} onClose={handleCancelCrop} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust profile picture</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Drag to reposition, use the slider to zoom, then confirm to preview the cropped image.
          </DialogContentText>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 320,
              bgcolor: '#111',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {rawImage && (
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </Box>
          <Box sx={{ mt: 3, px: 1 }}>
            <Typography variant="body2" gutterBottom>
              Zoom
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_e, value) => setZoom(value)}
              aria-label="Zoom"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCrop} disabled={cropping}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmCrop}
            disabled={cropping || !croppedAreaPixels}
          >
            {cropping ? <CircularProgress size={20} /> : 'Use photo'}
          </Button>
        </DialogActions>
      </Dialog>
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
    savePrefs({ email: emailNotifs, system: checked, meetings: meetingNotifs });
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

function AccountSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = () => {
    window.location.href = '/change-password';
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleDelete = () => {
    setDeleteError('');
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/delete-account`, {
        headers: { 'x-auth-token': token },
      });

      // Clear profile picture and all local session data
      localStorage.removeItem('profileAvatar');
      localStorage.clear();
      setConfirmOpen(false);
      window.location.href = '/';
    } catch (err) {
      setDeleteError(
        err.response?.data?.msg || 'Failed to delete account. Please try again.'
      );
      setDeleting(false);
    }
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
          Change Password
        </Button>
       
        <Button variant="outlined" size="medium" color="error" onClick={handleDelete}>
          Delete Account
        </Button>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
      >
        <DialogTitle>Delete account permanently?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is permanent and cannot be undone. Your account and all
            associated data will be permanently deleted from the database,
            including your profile picture if one exists. You will be logged out
            and redirected to the login page.
          </DialogContentText>
          {deleteError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function Settings({ onProfileUpdate }) {
  const [activeSection, setActiveSection] = useState('Profile');

  const renderSection = () => {
    switch (activeSection) {
      case 'Profile':
        return <ProfileSection onProfileUpdate={onProfileUpdate} />;
      case 'Notifications':
        return <NotificationsSection />;
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
