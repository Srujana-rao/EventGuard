const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('../passport'); // Adjust path to your passport config

const User = require('../models/User');


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
// GOOGLE OAUTH ROUTES
// ==========================

// Initiate Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Generate JWT token for authenticated user
    const payload = {
      user: {
        id: req.user.id,
        role: req.user.role
      }
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    // Redirect to frontend with token in query parameters
    // Update URL if your frontend runs on different origin/port
    res.redirect(`http://localhost:5173/social-success?token=${token}`);
  }
);


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
        role: 'ground',  // Default role
        isApproved: false // Needs approval by 'head'
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
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
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
      // Respond success regardless to avoid email enumeration
      return res.status(200).json({ msg: 'If the email is registered, a reset link has been sent.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry

    await user.save();

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`; // Or your frontend URL

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
};
