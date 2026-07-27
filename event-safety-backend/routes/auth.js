const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const User = require('../models/User');
const Meeting = require('../models/Meeting');
const passport = require('../passport');

let io;
const setIo = (serverIo) => {
  io = serverIo;
};


// Middleware to protect routes by JWT token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token)
    return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};


// Middleware to restrict access by specific roles
const authorizeRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Access denied: Insufficient role' });
  }
  next();
};


// ==========================
// EMAIL/PASSWORD AUTH ROUTES
// ==========================

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
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    try {
      let user = await User.findOne({ $or: [{ username }, { email }] });

      if (user)
        return res.status(400).json({ msg: 'User with that username or email already exists' });

      user = new User({
        username,
        email,
        password,
        role: 'ground',
        isApproved: false
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      if (io) {
        io.to('head').emit('pending-summary-update');
      }

      res.status(201).json({
        msg: 'Registration successful! Awaiting head approval.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ==========================
// GOOGLE OAUTH ROUTES
// ==========================

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    if (!req.user.isApproved) {
      return res.redirect(`http://localhost:5173/pending-approval`);
    }

    const payload = {
      user: {
        id: req.user.id,
        role: req.user.role
      }
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.redirect(`http://localhost:5173/social-success?token=${token}&username=${encodeURIComponent(req.user.username)}&role=${req.user.role}&userId=${req.user.id}`);
  }
);

// USER LOGIN
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: 'Invalid Credentials' });

      if (!user.isApproved)
        return res.status(403).json({ msg: 'Account not yet approved by team head.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: 'Invalid Credentials' });

      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          });
        }
      );

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// UPDATE CURRENT USER PROFILE
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const updates = {};
    if (typeof req.body.username === 'string') {
      const trimmedUsername = req.body.username.trim();
      if (!trimmedUsername) {
        return res.status(400).json({ msg: 'Username is required' });
      }

      if (trimmedUsername !== user.username) {
        const existingUser = await User.findOne({ username: trimmedUsername, _id: { $ne: user._id } });
        if (existingUser) {
          return res.status(400).json({ msg: 'Username already in use' });
        }
      }

      updates.username = trimmedUsername;
    }

    if (typeof req.body.email === 'string') {
      const normalizedEmail = req.body.email.trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ msg: 'Email is required' });
      }

      if (normalizedEmail !== user.email) {
        const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({ msg: 'Email already in use' });
        }
      }

      updates.email = normalizedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({
        msg: 'Profile already up to date',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        }
      });
    }

    Object.assign(user, updates);
    await user.save();

    if (io) {
      io.emit('user-updated', {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }

    res.json({
      msg: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET CURRENT LOGGED-IN USER
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET PENDING USERS FOR APPROVAL (HEAD ONLY)
router.get('/pending-users', auth, authorizeRole(['head']), async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false }).select('-password');
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// APPROVE USER & SET ROLE (HEAD ONLY)
router.post('/approve-user/:id', auth, authorizeRole(['head']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    let user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ msg: 'User not found' });

    user.isApproved = true;
    if (role && ['head', 'room', 'ground'].includes(role)) {
      user.role = role;
    }
    await user.save();

    res.json({
      msg: 'User approved and role set!',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isApproved: user.isApproved,
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// REQUEST ROLE CHANGE — awaiting head approval
router.post('/request-role-change', auth, async (req, res) => {
  const { role } = req.body;
  if (!['room', 'ground'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role requested' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.role === 'head') {
      return res.status(403).json({ msg: 'Head users cannot request a role change.' });
    }

    if (user.role === role) {
      return res.status(400).json({ msg: 'You already have this role.' });
    }

    // Keep the current role unchanged until a head approves.
    user.pendingRole = role;
    user.roleChangeStatus = 'pending';
    await user.save();

    if (io) {
      io.to('head').emit('pending-summary-update');
    }

    res.json({
      msg: 'Role change requested, awaiting head approval. Your current role is unchanged.',
      role: user.role,
      pendingRole: user.pendingRole,
      roleChangeStatus: user.roleChangeStatus,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET PENDING ROLE CHANGE REQUESTS (HEAD ONLY)
router.get('/pending-role-changes', auth, authorizeRole(['head']), async (req, res) => {
  try {
    const pending = await User.find({ roleChangeStatus: 'pending' }).select('-password');
    res.json(pending);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// APPROVE ROLE CHANGE (HEAD ONLY)
router.post('/approve-role-change/:id', auth, authorizeRole(['head']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.roleChangeStatus !== 'pending' || !user.pendingRole) {
      return res.status(400).json({ msg: 'No pending role change for this user' });
    }

    user.role = user.pendingRole;
    user.pendingRole = null;
    user.roleChangeStatus = 'approved';
    await user.save();

    res.json({
      msg: 'Role change approved.',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        roleChangeStatus: user.roleChangeStatus,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// REJECT ROLE CHANGE (HEAD ONLY)
router.post('/reject-role-change/:id', auth, authorizeRole(['head']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.roleChangeStatus !== 'pending') {
      return res.status(400).json({ msg: 'No pending role change for this user' });
    }

    // Clear the request only — do not modify the user's existing role.
    const unchangedRole = user.role;
    user.pendingRole = null;
    user.roleChangeStatus = 'rejected';
    await user.save();

    res.json({
      msg: 'Role change rejected. Existing role remains unchanged.',
      user: {
        id: user.id,
        username: user.username,
        role: unchangedRole,
        roleChangeStatus: user.roleChangeStatus,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PENDING COUNTS SUMMARY FOR SIDEBAR BADGES (HEAD ONLY)
router.get('/pending-summary', auth, authorizeRole(['head']), async (req, res) => {
  try {
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const pendingRoleChanges = await User.countDocuments({ roleChangeStatus: 'pending' });
    res.json({
      pendingUsers,
      pendingRoleChanges,
      total: pendingUsers + pendingRoleChanges,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ==================
// DELETE ACCOUNT (permanent)
// ==================
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const username = user.username;

    // Remove associated meetings created by this user
    await Meeting.deleteMany({ createdBy: username });

    // Remove associated alerts sent by this user (model is registered in server.js)
    if (mongoose.models.Alert) {
      await mongoose.model('Alert').deleteMany({ sender: username });
    }

    await User.findByIdAndDelete(user.id);

    res.json({ msg: 'Account permanently deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================
// FORGOT PASSWORD
// ==================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ msg: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ msg: 'If the email is registered, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - EventGuard',
      html: `
        <p>Hi ${user.username},</p>
        <p>You requested a password reset.</p>
        <p>Please click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'If the email is registered, a reset link has been sent.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================
// RESET PASSWORD
// ==================
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6)
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ msg: 'Reset token is invalid or expired' });

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
  setIo,
};