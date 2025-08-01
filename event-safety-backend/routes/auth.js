const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('../models/User');

// Middleware to protect routes
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware for role-based authorization
const authorizeRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Access denied: Insufficient role' });
    }
    next();
};


// USER REGISTRATION
router.post(
    '/signup',
    [
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
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
                role: 'ground',         // Default role
                isApproved: false,      // Needs approval
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            res.status(201).json({
                msg: 'Registration successful! Awaiting head approval.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isApproved: user.isApproved,
                },
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);


// LOGIN
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
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
                    role: user.role,
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5h' },
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


// GET CURRENT USER (secured)
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// GET PENDING USERS (head only)
router.get('/pending-users', auth, authorizeRole(['head']), async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false }).select('-password');
        res.json(pendingUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// APPROVE USER (head only)
router.post('/approve-user/:id', auth, authorizeRole(['head']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.isApproved = true;
        if (role && ['head', 'room', 'ground'].includes(role)) {
            user.role = role;
        }
        await user.save();

        res.json({ msg: 'User approved and role set!', user: { id: user.id, username: user.username, role: user.role, isApproved: user.isApproved } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// --- PASSWORD RESET RELATED ROUTES ---

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'Email is required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal user existence
            return res.status(200).json({ msg: 'If the email is registered, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Setup nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // or another service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `http://localhost:5173/reset-password/${token}`;


        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset - EventGuard',
            html: `<p>Hi ${user.username},</p>
                <p>You requested a password reset for your account on EventGuard.</p>
                <p>Please click the link below to reset your password. This link will expire in 1 hour.</p>
                <p><a href="${resetUrl}">Reset Password</a></p>
                <p>If you did not request this, please ignore this email.</p>`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ msg: 'If the email is registered, a reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Reset token is invalid or expired' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


module.exports = {
    router,
    auth,
    authorizeRole,
};
