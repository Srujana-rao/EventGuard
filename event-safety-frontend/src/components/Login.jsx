import React, { useState } from 'react'; 
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';

// The 'socket' instance is now ONLY managed in App.jsx.
// This component no longer needs to import 'io' or create its own socket.

const Login = ({ setAuth }) => { 
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify({ email, password });

            const res = await axios.post('http://localhost:5000/api/auth/login', body, config);
            
            // On successful login, save the token and user data
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // Trigger the authentication state update in App.jsx.
            // App.jsx's useEffect will then connect and authenticate the *correct* socket instance.
            setAuth(true); 
            navigate('/'); // Navigate to dashboard after login
            setError(null);
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            setError(err.response && err.response.data && err.response.data.msg ? err.response.data.msg : 'Login failed. Please check credentials or approval status.');
            if (err.response && err.response.data && err.response.data.errors) {
                setError(err.response.data.errors.map(e => e.msg).join(', '));
            }
        }
    };

    return (
        <div className="auth-container section-card">
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        required
                    />
                </div>
                <button type="submit" className="button-primary">Login</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            <p className="auth-switch-text">
                Don't have an account? <span onClick={() => navigate('/signup')} className="auth-link">Sign Up</span>
            </p>
        </div>
    );
};

export default Login;