import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '' // For password confirmation
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const { username, email, password, password2 } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password !== password2) {
            setError('Passwords do not match');
            return;
        } else {
            setError(null); // Clear error if passwords match
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const body = JSON.stringify({ username, email, password });

            const res = await axios.post('http://localhost:5000/api/auth/signup', body, config);
            setMessage(res.data.msg || 'Registration successful! Awaiting head approval.');
            setError(null);
            // Optionally navigate to login or a success page after signup
            setTimeout(() => navigate('/login'), 3000); // Navigate to login after 3 seconds
        } catch (err) {
            console.error(err.response ? err.response.data : err.message);
            setMessage(''); // Clear success message on error
            setError(err.response && err.response.data && err.response.data.errors ? err.response.data.msg : 'Registration failed. Please try again.');
            if (err.response && err.response.data && err.response.data.errors) {
                setError(err.response.data.errors.map(e => e.msg).join(', '));
            }
        }
    };

    return (
        <div className="auth-container section-card">
            <h2>Sign Up</h2>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={onChange}
                        required
                    />
                </div>
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
                        minLength="6"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password2">Confirm Password:</label>
                    <input
                        type="password"
                        id="password2"
                        name="password2"
                        value={password2}
                        onChange={onChange}
                        required
                        minLength="6"
                    />
                </div>
                <button type="submit" className="button-primary">Register</button>
            </form>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <p className="auth-switch-text">
                Already have an account? <span onClick={() => navigate('/login')} className="auth-link">Login</span>
            </p>
        </div>
    );
};

export default Signup;