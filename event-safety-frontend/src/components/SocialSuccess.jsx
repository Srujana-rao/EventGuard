import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';

export default function SocialSuccess({ setAuth }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    if (!token) {
      navigate('/login');
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: userId, username, role }));
    setAuth(true);

    setTimeout(() => {
      if (!socket.connected) {
        socket.connect();
      }
      socket.once('connect', () => {
        socket.emit('authenticate', token);
      });
      if (socket.connected) {
        socket.emit('authenticate', token);
      }
    }, 100);

    navigate('/dashboard');
  }, [searchParams, navigate, setAuth]);

  return null;
}