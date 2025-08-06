import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HeadDashboard = ({ userRole }) => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState({}); // To manage role dropdowns per user

    const API_BASE_URL = 'http://localhost:5000/api';
    const navigate = useNavigate();

    // Fetch pending users
    const fetchPendingUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Not authenticated. Please log in.");
                setLoading(false);
                navigate('/login'); // Redirect to login if no token
                return;
            }
            const config = {
                headers: {
                    'x-auth-token': token
                }
            };
            const res = await axios.get(`${API_BASE_URL}/auth/pending-users`, config);
            setPendingUsers(res.data);
            setLoading(false);
            // Initialize selectedRole state for each user
            const initialRoles = {};
            res.data.forEach(user => {
                initialRoles[user._id] = user.role; // Set initial selected role to current role
            });
            setSelectedRole(initialRoles);

        } catch (err) {
            console.error("Error fetching pending users:", err);
            setError(err.response?.data?.msg || "Failed to fetch pending users.");
            setLoading(false);
            if (err.response?.status === 401 || err.response?.status === 403) {
                // Token expired or insufficient role, log out
                localStorage.clear();
                delete axios.defaults.headers.common['x-auth-token'];
                navigate('/login');
            }
        }
    };

    // Approve user and optionally set role
    const handleApproveUser = async (userId) => {
        setMessage('');
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            };
            const body = { role: selectedRole[userId] }; // Send the selected role
            const res = await axios.post(`${API_BASE_URL}/auth/approve-user/${userId}`, body, config);
            
            setMessage(res.data.msg);
            fetchPendingUsers(); // Refresh list after approval
        } catch (err) {
            console.error("Error approving user:", err);
            setError(err.response?.data?.msg || "Failed to approve user.");
        }
    };

    // Fetch pending users on component mount
    useEffect(() => {
        if (userRole === 'head') { // Only fetch if current user is a head
            fetchPendingUsers();
        } else {
            setError("Access Denied: You must be a team head to view this dashboard.");
            setLoading(false);
        }
    }, [userRole]); // Re-fetch if userRole changes (e.g., after login)

    if (loading && !error) return <p className="section-card">Loading Head Dashboard...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (userRole !== 'head') return <p className="error-message">Access Denied: You must be a team head to view this page.</p>;


    return (
        <div className="head-dashboard section-card">
            <h2>Team Head User Approval Dashboard</h2>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <h3>Pending Approvals ({pendingUsers.length})</h3>
            {pendingUsers.length === 0 ? (
                <p>No pending users to approve.</p>
            ) : (
                <ul>
                    {pendingUsers.map(user => (
                        <li key={user._id} className="pending-user-item">
                            <div className="user-details">
                                <strong>Username:</strong> {user.username} <br />
                                <strong>Email:</strong> {user.email} <br />
                                <strong>Registered:</strong> {new Date(user.createdAt).toLocaleString()} <br />
                                <strong>Current Role:</strong> {user.role} (Default)
                            </div>
                            <div className="user-actions">
                                <label htmlFor={`role-${user._id}`}>Assign Role:</label>
                                <select
                                    id={`role-${user._id}`}
                                    value={selectedRole[user._id]}
                                    onChange={(e) => setSelectedRole({ ...selectedRole, [user._id]: e.target.value })}
                                    className="role-select"
                                >
                                    <option value="ground">Ground Member</option>
                                    <option value="room">Security Room</option>
                                    <option value="head">Team Head</option>
                                </select>
                                <button onClick={() => handleApproveUser(user._id)} className="button-accent">
                                    Approve & Set Role
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* You can add another section here for managing all active users later */}
            {/* <h3>Active Users</h3> */}
            {/* ... (logic to fetch and display all approved users) */}
        </div>
    );
};

export default HeadDashboard;