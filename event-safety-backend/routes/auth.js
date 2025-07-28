const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator'); // For input validation

const User = require('../models/User'); // Import the User model

// Middleware to protect routes
const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Attach user payload from JWT to request
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware to check specific role
const authorizeRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Access denied: Insufficient role' });
    }
    next();
};

// @route   POST api/auth/signup
// @desc    Register user (defaults to 'ground' role, isApproved: false)
// @access  Public
router.post(
    '/signup',
    [
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        try {
            let user = await User.findOne({ $or: [{ username }, { email }] });
            if (user) {
                return res.status(400).json({ msg: 'User with that username or email already exists' });
            }

            user = new User({
                username,
                email,
                password,
                role: 'ground', // Default new users to 'ground'
                isApproved: false // Requires head approval
            });

            // Hash password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // Return minimal user data and a message
            res.status(201).json({ msg: 'Registration successful! Awaiting head approval.', user: { id: user.id, username: user.username, email: user.email, role: user.role, isApproved: user.isApproved } });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Check if user is approved
            if (!user.isApproved) {
                return res.status(403).json({ msg: 'Account not yet approved by team head.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const payload = {
                user: {
                    id: user.id,
                    role: user.role // Include role in JWT payload
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5h' }, // Token expires in 5 hours
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   GET api/auth/me
// @desc    Get logged in user's details
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        // Select specific fields for security, exclude password
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/pending-users
// @desc    Get list of pending users for head approval
// @access  Private (Head only)
router.get('/pending-users', auth, authorizeRole(['head']), async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false }).select('-password');
        res.json(pendingUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/approve-user/:id
// @desc    Approve a pending user and optionally set role
// @access  Private (Head only)
router.post('/approve-user/:id', auth, authorizeRole(['head']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body; // New role, if provided

        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.isApproved = true;
        if (role && ['head', 'room', 'ground'].includes(role)) {
            user.role = role; // Update role if a valid one is provided
        }
        await user.save();

        res.json({ msg: 'User approved and role set!', user: { id: user.id, username: user.username, role: user.role, isApproved: user.isApproved } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = {
    router,
    auth,
    authorizeRole
};