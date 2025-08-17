import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../socket'; // Adjust path as needed

export default function SocialSuccess({ setAuth }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'x-auth-token': token }
      })
        .then(res => {
          localStorage.setItem('user', JSON.stringify(res.data));
          setAuth(true);

          // 🔑 --- Explicitly connect/re-authenticate the socket with the latest token ---
          socket.auth = { token };
          if (!socket.connected) {
            socket.connect();
          } else {
            socket.emit('authenticate', token);
          }
          // -------------------------------------------------------

          navigate('/dashboard');
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuth(false);
          navigate('/login');
        });
    } else {
      setAuth(false);
      navigate('/login');
    }
  }, [setAuth, navigate]);

  return <div>Signing you in via Google...</div>;
}
