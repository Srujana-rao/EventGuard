import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  InputAdornment,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const getRoleLabel = (role) => {
  if (role === 'room') return 'Room Staff';
  if (role === 'ground') return 'Ground Staff';
  return role || 'Staff';
};

const getMemberId = (member) => String(member?._id || member?.id || '');

export default function Teams({ userRole }) {
  const [teams, setTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [teamHeadId, setTeamHeadId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Synchronous guard against double-submission (state updates are async,
  // so a fast double-click can fire two requests before `submitting` re-renders)
 const isHead = userRole === 'head';

  const isSubmittingRef = useRef(false);

  const token = localStorage.getItem('token');

  // Tell DashboardShell to hide its top bar while the create/edit dialog is open
  // (Dialog's default z-index sits below the fixed top bar, causing the overlap)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('teams-dialog-toggle', { detail: { open: openDialog } }));
    return () => {
      if (openDialog) {
        window.dispatchEvent(new CustomEvent('teams-dialog-toggle', { detail: { open: false } }));
      }
    };
  }, [openDialog]);

  const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    if (isHead) {
      const [teamRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teams`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_BASE_URL}/users`),
      ]);
      setTeams(teamRes.data || []);
      setStaff(
        (staffRes.data || []).filter(
          (member) => member.role === 'ground' || member.role === 'room'
        )
      );
    } else {
      const teamRes = await axios.get(`${API_BASE_URL}/teams`, { headers: { 'x-auth-token': token } });
      setTeams(teamRes.data || []);
    }
    setError('');
  } catch (err) {
    setError('Failed to load teams and staff information.');
    console.error('Error fetching teams:', err);
  } finally {
    setLoading(false);
  }
}, [token, isHead]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStaff = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return staff.filter((member) => {
      if (!query) return true;
      return [member.username, member.email, getRoleLabel(member.role)]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [staff, searchText]);

  const selectedMembers = useMemo(() => {
    const selectedSet = new Set(selectedMemberIds.map(String));
    return staff.filter((member) => selectedSet.has(getMemberId(member)));
  }, [selectedMemberIds, staff]);

  // Clear team head selection if that person gets unselected as a member
  useEffect(() => {
    if (teamHeadId && !selectedMemberIds.includes(teamHeadId)) {
      setTeamHeadId('');
    }
  }, [selectedMemberIds, teamHeadId]);

  const resetDialog = () => {
    setTeamName('');
    setSearchText('');
    setSelectedMemberIds([]);
    setTeamHeadId('');
    setEditingTeam(null);
  };

  const openCreateDialog = () => {
    resetDialog();
    setOpenDialog(true);
  };

  const openEditDialog = (team) => {
    setEditingTeam(team);
    setTeamName(team.name || '');
    setSelectedMemberIds(
      (team.members || [])
        .map((member) => getMemberId(member))
        .filter(Boolean)
    );
    setTeamHeadId(team.teamHead ? getMemberId(team.teamHead) : '');
    setSearchText('');
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    resetDialog();
  };

  const handleMemberToggle = (memberId) => {
    const id = String(memberId);
    if (!id) return;
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim() || selectedMemberIds.length === 0) return;

    // Block duplicate fires (e.g. fast double-click) before React state catches up
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setSubmitting(true);
    setError('');
    setSuccess('');

    const nameBeingSaved = teamName.trim();
    const wasEditing = editingTeam;

    try {
      const payload = { name: nameBeingSaved, members: selectedMemberIds, teamHead: teamHeadId || null };

      if (wasEditing) {
        await axios.put(`${API_BASE_URL}/teams/${editingTeam._id}`, payload, {
          headers: { 'x-auth-token': token },
        });
        setSuccess('Team updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/teams`, payload, {
          headers: { 'x-auth-token': token },
        });
        setSuccess('Team created successfully!');
      }

      closeDialog();

      try {
        await fetchData();
      } catch (fetchErr) {
        console.error('Error refreshing teams list:', fetchErr);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // The request errored client-side (timeout, dropped response, etc.) —
      // verify against the server before assuming it actually failed, since
      // the backend may have completed the write despite the lost response.
      try {
        const checkRes = await axios.get(`${API_BASE_URL}/teams`, {
          headers: { 'x-auth-token': token },
        });
        const nowExists = (checkRes.data || []).some(
          (t) => t.name?.toLowerCase() === nameBeingSaved.toLowerCase()
        );

        if (nowExists) {
          setTeams(checkRes.data || []);
          setSuccess(wasEditing ? 'Team updated successfully!' : 'Team created successfully!');
          closeDialog();
          setTimeout(() => setSuccess(''), 3000);
          return;
        }
      } catch {
        // verification call itself failed — fall through to show the original error
      }

      const errorMsg = err.response?.data?.message || 'Unable to save team.';
      setError(errorMsg);
      console.error('Error saving team:', err);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const confirmDelete = (team) => {
    setTeamToDelete(team);
    setDeleteDialog(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      setError('');
      setSuccess('');
      await axios.delete(`${API_BASE_URL}/teams/${teamToDelete._id}`, {
        headers: { 'x-auth-token': token },
      });
      setSuccess('Team deleted successfully!');
      setDeleteDialog(false);
      setTeamToDelete(null);

      try {
        await fetchData();
      } catch (fetchErr) {
        console.error('Error refreshing teams list:', fetchErr);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Unable to delete team.';
      setError(errorMsg);
      console.error('Error deleting team:', err);
    }
  };

  return (
    <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
      <Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    mb: 3,
    gap: 2,
    flexWrap: 'wrap',
  }}
>
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="h5" fontWeight={700} gutterBottom>
      Teams
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {isHead
        ? 'Create and manage response teams by assigning available staff members.'
        : 'View response teams and their assigned members.'}
    </Typography>
  </Box>
  {isHead && (
    <Button
      variant="contained"
      startIcon={<PersonAddIcon />}
      onClick={openCreateDialog}
      sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 600 }}
    >
      Create Team
    </Button>
  )}
</Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading teams...</Typography>
      ) : teams.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No teams have been created yet.
        </Typography>
      ) : (
        <TableContainer
          component={Box}
          sx={{
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            overflowX: 'auto',
            width: '100%',
          }}
        >
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell><strong>Team Name</strong></TableCell>
                <TableCell><strong>Members</strong></TableCell>
                <TableCell><strong>Team Head</strong></TableCell>
                <TableCell><strong>Created Date</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team._id} hover>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.members?.length || 0}</TableCell>
                  <TableCell>{team.teamHead?.username || '—'}</TableCell>
                  <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
    <Button
      size="small"
      variant="outlined"
      startIcon={<VisibilityIcon />}
      onClick={() => {
        setViewingTeam(team);
        setViewDialog(true);
      }}
      sx={{ textTransform: 'none' }}
    >
      View
    </Button>
    {isHead && (
      <>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => openEditDialog(team)}
          sx={{ textTransform: 'none' }}
        >
          Edit
        </Button>
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => confirmDelete(team)}
          sx={{ textTransform: 'none' }}
        >
          Delete
        </Button>
      </>
    )}
  </Box>
</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { maxHeight: '85vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingTeam ? 'Edit Team' : 'Create Team'}
          <IconButton onClick={closeDialog} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Team Name"
            placeholder="Enter Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Assign Members
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, or role"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Available Staff
              </Typography>
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  p: 1.5,
                  maxHeight: 320,
                  overflowY: 'auto',
                }}
              >
                {filteredStaff.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No matching staff found.
                  </Typography>
                ) : (
                  filteredStaff.map((member) => {
                    const memberId = getMemberId(member);
                    const checked = selectedMemberIds.includes(memberId);
                    return (
                      <Box
                        key={memberId}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                          borderBottom: '1px solid #f1f5f9',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#667eea', flexShrink: 0 }}>
                            {(member.username || 'S').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {member.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {getRoleLabel(member.role)}
                            </Typography>
                            {member.email && (
                              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                {member.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Checkbox
                          checked={checked}
                          onChange={() => handleMemberToggle(memberId)}
                          inputProps={{ 'aria-label': `Select ${member.username}` }}
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Selected Members ({selectedMembers.length})
              </Typography>
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  p: 1.5,
                  minHeight: 256,
                  maxHeight: 320,
                  overflowY: 'auto',
                }}
              >
                {selectedMembers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No members selected yet.
                  </Typography>
                ) : (
                  selectedMembers.map((member) => {
                    const memberId = getMemberId(member);
                    return (
                      <Chip
                        key={memberId}
                        label={member.username}
                        onDelete={() => handleMemberToggle(memberId)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Team Head
            </Typography>
            <FormControl fullWidth size="small" disabled={selectedMembers.length === 0}>
              <InputLabel id="team-head-label">Select team head</InputLabel>
              <Select
                labelId="team-head-label"
                label="Select team head"
                value={teamHeadId}
                onChange={(e) => setTeamHeadId(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {selectedMembers.map((member) => (
                  <MenuItem key={getMemberId(member)} value={getMemberId(member)}>
                    {member.username} ({getRoleLabel(member.role)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedMembers.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                Select members first to choose a team head.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!teamName.trim() || selectedMemberIds.length === 0 || submitting}
            onClick={handleSaveTeam}
            sx={{ textTransform: 'none' }}
          >
            {submitting ? 'Saving...' : editingTeam ? 'Save Changes' : 'Create Team'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialog && Boolean(viewingTeam)}
        onClose={() => {
          setViewDialog(false);
          setViewingTeam(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {viewingTeam?.name || 'Team Details'}
          <IconButton
            onClick={() => {
              setViewDialog(false);
              setViewingTeam(null);
            }}
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Created On: {viewingTeam ? new Date(viewingTeam.createdAt).toLocaleDateString() : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Created By: {viewingTeam?.createdBy?.username || 'Head'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Team Head: {viewingTeam?.teamHead?.username || 'Not assigned'}
          </Typography>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Members ({viewingTeam?.members?.length || 0})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {viewingTeam?.members?.length ? (
            viewingTeam.members.map((member) => {
              const memberId = getMemberId(member);
              return (
                <Box
                  key={memberId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.2,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#667eea' }}>
                    {(member.username || 'S').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {member.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getRoleLabel(member.role)}
                    </Typography>
                    {member.email && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {member.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">
              No members assigned.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{teamToDelete?.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteTeam} sx={{ textTransform: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}