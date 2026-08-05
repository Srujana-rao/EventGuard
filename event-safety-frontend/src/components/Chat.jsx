import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Badge,
  Divider,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { socket } from '../socket';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const getRoleLabel = (role) => {
  if (role === 'head') return 'Head';
  if (role === 'room') return 'Room Staff';
  if (role === 'ground') return 'Ground Staff';
  return role || '';
};

export default function Chat() {
  const [contacts, setContacts] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const token = localStorage.getItem('token');
  const messagesEndRef = useRef(null);

  const currentUserId = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.id || parsed?._id || null;
    } catch {
      return null;
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`);
      setContacts((res.data || []).filter((u) => String(u._id) !== String(currentUserId)));
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [currentUserId]);

  const fetchUnreadMap = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/unread-by-sender`, {
        headers: { 'x-auth-token': token },
      });
      setUnreadMap(res.data || {});
    } catch (err) {
      console.error('Error fetching unread map:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchContacts();
    fetchUnreadMap();
  }, [fetchContacts, fetchUnreadMap]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openConversation = useCallback(async (contact) => {
    setSelectedContact(contact);
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/messages/${contact._id}`, {
        headers: { 'x-auth-token': token },
      });
      setMessages(res.data || []);

      // Mark this conversation read on the server, then clear locally and
      // signal the sidebar badge to refresh (mirrors the pattern used for
      // Teams' dialog-open signal elsewhere in the app).
      await axios.patch(`${API_BASE_URL}/chat/read/${contact._id}`, {}, {
        headers: { 'x-auth-token': token },
      });
      setUnreadMap((prev) => ({ ...prev, [contact._id]: 0 }));
      window.dispatchEvent(new CustomEvent('chat-badge-refresh'));
    } catch (err) {
      console.error('Error loading conversation:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [token]);

  useEffect(() => {
    const handleReceive = (payload) => {
      const involvesOpenThread =
        selectedContact &&
        (String(payload.sender) === String(selectedContact._id) ||
          String(payload.receiver) === String(selectedContact._id));

      if (involvesOpenThread) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(payload._id))) return prev;
          return [...prev, payload];
        });
        setTimeout(scrollToBottom, 50);

        // If the incoming message is from the contact we're currently
        // viewing, mark it read immediately rather than letting it sit
        // unread in the badge.
        if (String(payload.sender) === String(selectedContact._id)) {
          axios
            .patch(`${API_BASE_URL}/chat/read/${selectedContact._id}`, {}, {
              headers: { 'x-auth-token': token },
            })
            .then(() => {
              window.dispatchEvent(new CustomEvent('chat-badge-refresh'));
            })
            .catch(() => {});
        }
      } else {
        // Message for a different contact — just refresh the unread counts
        fetchUnreadMap();
      }
    };

    socket.on('receive-chat-message', handleReceive);
    return () => socket.off('receive-chat-message', handleReceive);
  }, [selectedContact, token, fetchUnreadMap]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;

    socket.emit('send-chat-message', {
      receiverId: selectedContact._id,
      text: messageText.trim(),
    });

    setMessageText('');
  };

  const handleBackToList = () => {
    setSelectedContact(null);
  };

  const ContactList = (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        flexShrink: 0,
        borderRight: { xs: 'none', md: '1px solid #e5e7eb' },
        display: { xs: selectedContact ? 'none' : 'flex', md: 'flex' },
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" fontWeight={700}>
          Chat
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {loadingContacts ? (
          <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
            Loading contacts...
          </Typography>
        ) : contacts.length === 0 ? (
          <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
            No contacts found.
          </Typography>
        ) : (
          contacts.map((contact) => {
            const unread = unreadMap[contact._id] || 0;
            const isSelected = selectedContact?._id === contact._id;
            return (
              <Box
                key={contact._id}
                onClick={() => openConversation(contact)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'rgba(102,126,234,0.1)' : 'transparent',
                  borderBottom: '1px solid #f1f5f9',
                  '&:hover': { bgcolor: 'rgba(102,126,234,0.06)' },
                }}
              >
                <Badge
                  color="error"
                  badgeContent={unread}
                  max={99}
                  invisible={unread === 0}
                >
                  <Avatar sx={{ bgcolor: '#667eea', width: 38, height: 38 }}>
                    {(contact.username || '?').charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {contact.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleLabel(contact.role)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );

  const ConversationThread = (
    <Box
      sx={{
        flexGrow: 1,
        display: { xs: selectedContact ? 'flex' : 'none', md: 'flex' },
        flexDirection: 'column',
        minWidth: 0,
        width: '100%',
      }}
    >
      {!selectedContact ? (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Select a contact to start chatting.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ p: { xs: 1.5, md: 2 }, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={handleBackToList}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              aria-label="Back to contacts"
            >
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: '#667eea', width: 34, height: 34 }}>
              {(selectedContact.username || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" fontWeight={600} noWrap>
                {selectedContact.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoleLabel(selectedContact.role)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {loadingMessages ? (
              <Typography variant="body2" color="text.secondary">
                Loading messages...
              </Typography>
            ) : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No messages yet. Say hello!
              </Typography>
            ) : (
              messages.map((msg) => {
                const isMine = String(msg.sender) === String(currentUserId);
                return (
                  <Box
                    key={msg._id}
                    sx={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: { xs: '85%', sm: '70%' },
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: isMine ? '#667eea' : '#f1f5f9',
                        color: isMine ? '#fff' : '#333',
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        wordBreak: 'break-word',
                      }}
                    >
                      <Typography variant="body2">{msg.text}</Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.3, textAlign: isMine ? 'right' : 'left' }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Divider />
          <Box component="form" onSubmit={handleSend} sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoComplete="off"
              sx={{
                '& .MuiOutlinedInput-input': {
                  pl: 2,
                  pr: 2,
                  py: 1.25,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!messageText.trim()}
              sx={{ minWidth: 0, px: 2, flexShrink: 0 }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        height: { xs: 'calc(100vh - 130px)', md: 'calc(100vh - 140px)' },
        display: 'flex',
      }}
    >
      {ContactList}
      {ConversationThread}
    </Paper>
  );
}