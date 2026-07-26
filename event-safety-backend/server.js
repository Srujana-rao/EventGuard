require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path'); // Node.js path module, needed for file paths

const authRoutes = require('./routes/auth'); // Import authentication routes
const User = require('./models/User'); // Import User model
const Meeting = require('./models/Meeting'); // Import Meeting model
const Team = require('./models/Team'); // Import Team model
const jwt = require('jsonwebtoken'); // NEW: Import JWT for Socket.IO auth
const auth = require('./routes/auth').auth; // FIX: Import auth middleware directly for protected routes (like delete)
// const authorizeRole = require('./routes/auth').authorizeRole; // Optional: import if needed directly in server.js routes

const http = require('http'); // Node.js native HTTP module
const { Server } = require("socket.io"); // Socket.IO server class

const app = express();
const port = process.env.PORT || 5000;

// --- Create HTTP server and attach Socket.IO ---
const server = http.createServer(app); // Create HTTP server from Express app
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow your React frontend to connect
        methods: ["GET", "POST"]
    }
});
// ----------------------------------------------------

// --- Multer configurations for different upload types ---
// 1. For alerts AND incidents: Disk storage (saves to 'uploads' folder)
const mediaStorage = multer.diskStorage({ // Renamed from alertStorage for clarity, used for both alerts and incidents
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Files will be saved in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        // Generate a unique filename: fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const uploadMediaToDisk = multer({ storage: mediaStorage }); // Renamed from uploadAlertMedia

// 2. For uploads: memory storage (kept minimal)
// -------------------------------------------------------------------------

// Middleware
app.use(cors()); // Enable CORS for all routes (important for frontend communication)
app.use(express.json()); // Enable JSON body parsing for incoming requests
// --- Serve static files from the 'uploads' directory ---
// Makes files in 'uploads' accessible via /uploads URL from the frontend
app.use('/uploads', express.static('uploads'));
// -----------------------------------------------------------
const session = require('express-session');
const passport = require('./passport'); // adjust path if passport.js is located elsewhere

// Add Express session middleware; place this before route handlers
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key', // better to use .env variable
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport and use session middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schema and Model for Incidents
const incidentSchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String, default: '' },
    location: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    visionLabels: { type: Array, default: [] },
    imageUrl: { type: String }, // To store the URL of the uploaded image for incidents
    // (Removed AI-generated fields: severity, actions)
}, { timestamps: true });
const Incident = mongoose.model('Incident', incidentSchema);

// --- NEW: Define Mongoose Schema and Model for Alerts ---
const alertSchema = new mongoose.Schema({
    message: { type: String, trim: true },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'audio', null], default: null },
    sender: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    senderRole: { type: String, required: true },
    targetRole: { type: String, enum: ['all', 'head', 'room', 'ground', null], default: null }, // Null means 'all'
    priority: { type: String, enum: ['urgent', 'important', 'info'], default: 'info' }, // NEW: Priority field
    locationTag: { type: String, trim: true, default: '' } // NEW: Location Tag field
}, { timestamps: true });
const Alert = mongoose.model('Alert', alertSchema);
// --------------------------------------------------------


// --- Map to store connected users by their roles ---
const connectedUsersByRole = {
    head: new Set(),
    room: new Set(),
    ground: new Set(),
};
const socketToUserId = new Map();
const userIdToSocketId = new Map();
// --------------------------------------------------------

// --- Socket.IO Event Handling ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle authentication on socket connection
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.user.id);

            if (!user || !user.isApproved) {
                console.warn(`Socket auth failed: User ${decoded.user.id} not found or not approved.`);
                socket.disconnect(); // Disconnect unapproved or invalid users
                return;
            }

            // Store user info on the socket object (always use string IDs for presence checks)
            const userId = String(user._id);
            socket.user = { id: userId, username: user.username, role: user.role };
            socketToUserId.set(socket.id, userId);
            userIdToSocketId.set(userId, socket.id);

            // Add socket to appropriate role set
            connectedUsersByRole[user.role].add(socket.id);
            socket.join(user.role);
            console.log(`User ${user.username} (${user.role}) authenticated via Socket.IO. Current connections:`, {
                head: connectedUsersByRole.head.size,
                room: connectedUsersByRole.room.size,
                ground: connectedUsersByRole.ground.size,
            });
            // Let the client know authentication was successful
            socket.emit('authenticated', { status: true, user: { id: userId, username: user.username, role: user.role } });
            io.emit('presence-updated');

        } catch (err) {
            console.error(`Socket authentication failed for ${socket.id}:`, err.message);
            if (err.name === 'TokenExpiredError') {
                console.error('JWT Token Expired!');
                socket.emit('auth-error', { message: 'Session expired, please log in again.' });
            } else if (err.name === 'JsonWebTokenError') {
                console.error('Invalid JWT Token!');
                socket.emit('auth-error', { message: 'Invalid token, please log in again.' });
            }
            socket.disconnect();
        }
    });

    // Handle a 'send-alert' event from a client
    socket.on('send-alert', async (alertData) => { // Made async for DB save
        if (!socket.user) { // Ensure user is authenticated before sending alerts
            console.warn(`Unauthenticated user ${socket.id} tried to send alert.`);
            return;
        }

        const { targetRole, message, mediaUrl, mediaType, priority, locationTag } = alertData; // Destructure NEW fields

        const fullAlert = {
            message,
            sender: alertData.sender || socket.user.username,
            senderId: alertData.senderId || socket.user.id,
            senderRole: alertData.senderRole || socket.user.role,
            timestamp: new Date().toISOString(), // Use ISO string for consistency
            mediaUrl,
            mediaType,
            targetRole,
            priority,
            locationTag
        };

        console.log(`Alert from ${fullAlert.sender} (${fullAlert.senderRole}) (Target: ${targetRole || 'All'}) (Priority: ${priority || 'info'}) (Location: ${locationTag || 'N/A'}) :`, fullAlert.message);

        try {
            // --- Save alert to MongoDB before emitting ---
            const newAlert = new Alert(fullAlert);
            await newAlert.save();
            console.log('Alert saved to DB:', newAlert._id);
            // --------------------------------------------------

            // --- Emit based on targetRole (Actual Filtering Logic) ---
            // Include the _id from the saved alert so frontend can identify it
            if (targetRole && connectedUsersByRole[targetRole]) {
                console.log(`Emitting alert to ${targetRole} members.`);
                for (const targetSocketId of connectedUsersByRole[targetRole]) {
                    io.to(targetSocketId).emit('receive-alert', { ...fullAlert, _id: newAlert._id });
                }
            } else {
                // If targetRole is 'all' (null from frontend) or invalid/unspecified, emit to ALL authenticated users
                console.log('Emitting alert to all authenticated members (default).');
                for (const roleSet of Object.values(connectedUsersByRole)) {
                    for (const targetSocketId of roleSet) {
                        io.to(targetSocketId).emit('receive-alert', { ...fullAlert, _id: newAlert._id });
                    }
                }
            }
        } catch (error) {
            console.error('Error saving or emitting alert:', error.message);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (socket.user) { // Only remove if the socket was authenticated
            connectedUsersByRole[socket.user.role].delete(socket.id);
            socketToUserId.delete(socket.id);
            userIdToSocketId.delete(socket.user.id);
            console.log(`User ${socket.user.username} (${socket.user.role}) removed from connections. Current connections:`, {
                head: connectedUsersByRole.head.size,
                room: connectedUsersByRole.room.size,
                ground: connectedUsersByRole.ground.size,
            });
            io.emit('presence-updated');
        }
    });
});
// ------------------------------------------------------------

authRoutes.setIo(io);

// --- API Routes ---
app.get('/', (req, res) => {
    res.send('Event Safety Backend API is running!');
});

// UPDATED: Incident POST route to accept and save imageUrl
app.post('/api/incidents', async (req, res) => {
    try {
        const { type, location, imageUrl, description } = req.body; // NEW: include description
        if (!type || !location) {
            return res.status(400).json({ message: 'Type and location are required.' });
        }

        // Create incident without AI fields first
        let newIncident = new Incident({ type, location, imageUrl, description });
        await newIncident.save();

        // No AI processing: save and emit incident as-is
        io.emit('new-incident', newIncident);
        res.status(201).json(newIncident);
    } catch (error) {
        console.error('Error adding incident:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATED: Incident DELETE route
app.delete('/api/incidents/:id', auth, async (req, res) => { // Added 'auth' middleware
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ msg: 'Incident not found' });
        }

        // Optional: Authorization check - only allow user who created it, or specific roles to delete
        // if (incident.reporterId.toString() !== req.user.id && req.user.role !== 'head') {
        //     return res.status(401).json({ msg: 'Not authorized to delete this incident' });
        // }

        await Incident.deleteOne({ _id: req.params.id }); // Use deleteOne for Mongoose 6+
        
        io.emit('incident-deleted', req.params.id); // Inform clients about deleted incident

        res.json({ msg: 'Incident removed' });
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') { // Handle invalid incident ID format
            return res.status(404).json({ msg: 'Incident not found' });
        }
        res.status(500).send('Server error');
    }
});


app.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find();
        res.status(200).json(incidents);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// (Removed AI chat proxy route)

// (Removed AI image analysis route)

// --- Alert Media Upload Route (reusing for incident media too for simplicity) ---
app.post('/api/alert-media-upload', uploadMediaToDisk.single('alertMedia'), (req, res) => { // 'alertMedia' is the field name
    if (!req.file) {
        return res.status(400).json({ message: 'No media file uploaded.' });
    }
    // Respond with the URL where the file can be accessed
    const mediaUrl = `/uploads/${req.file.filename}`; // This URL is relative to your backend's base URL
    res.status(200).json({ message: 'Media uploaded successfully!', mediaUrl: mediaUrl });
});
// ------------------------------------

// --- API Route to fetch historical alerts ---
app.get('/api/alerts', async (req, res) => {
    try {
        // You might want to add authentication middleware 'auth' here later
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50); // Get latest 50 alerts by createdAt
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error fetching historical alerts:', error.message);
        res.status(500).json({ message: 'Failed to fetch historical alerts.' });
    }
});
// -------------------------------------------------

app.delete('/api/alerts/:id', auth, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ msg: 'Alert not found.' });
        }

        const currentUser = await User.findById(req.user.id).select('username');
        const isOwner = String(alert.senderId || '') === String(req.user.id)
            || (currentUser && alert.sender === currentUser.username);

        if (!isOwner) {
            return res.status(403).json({ msg: 'Only the alert owner can delete this alert.' });
        }

        await Alert.deleteOne({ _id: req.params.id });
        io.emit('alert-deleted', req.params.id);
        res.status(200).json({ msg: 'Alert deleted.' });
    } catch (error) {
        console.error('Error deleting alert:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Alert not found.' });
        }
        res.status(500).json({ message: 'Failed to delete alert.' });
    }
});

// --- Teams CRUD ---
app.get('/api/teams', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can manage teams.' });
        }

        const teams = await Team.find()
            .sort({ createdAt: -1 })
            .populate('members', 'username role email')
            .populate('createdBy', 'username')
            .populate('teamHead', 'username role email');
        res.status(200).json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error.message);
        res.status(500).json({ message: 'Failed to fetch teams.' });
    }
});

// Any authenticated staff member can check which team they belong to
app.get('/api/teams/my-team', auth, async (req, res) => {
    try {
        const team = await Team.findOne({ members: req.user.id })
            .populate('members', 'username role email')
            .populate('teamHead', 'username role email')
            .populate('createdBy', 'username');
        res.status(200).json(team || null);
    } catch (error) {
        console.error('Error fetching my-team:', error.message);
        res.status(500).json({ message: 'Failed to fetch team.' });
    }
});

app.post('/api/teams', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can create teams.' });
        }

        const { name, members = [], teamHead } = req.body;
        const trimmedName = (name || '').trim();
        if (!trimmedName) {
            return res.status(400).json({ message: 'Team name is required.' });
        }

        const existingTeam = await Team.findOne({ name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        if (existingTeam) {
            return res.status(400).json({ message: 'A team with this name already exists.' });
        }

        const validMemberIds = await User.find({ _id: { $in: members }, isApproved: true, role: { $in: ['ground', 'room'] } }).distinct('_id');

        let resolvedTeamHead = null;
        if (teamHead && validMemberIds.some((id) => String(id) === String(teamHead))) {
            resolvedTeamHead = teamHead;
        }

        const team = new Team({
            name: trimmedName,
            members: validMemberIds,
            teamHead: resolvedTeamHead,
            createdBy: req.user.id,
        });

        await team.save();
        const populatedTeam = await Team.findById(team._id)
            .populate('members', 'username role email')
            .populate('createdBy', 'username')
            .populate('teamHead', 'username role email');
        res.status(201).json(populatedTeam);
    } catch (error) {
        console.error('Error creating team:', error.message);
        res.status(500).json({ message: 'Failed to create team.' });
    }
});

app.put('/api/teams/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can update teams.' });
        }

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        const { name, members = [], teamHead } = req.body;
        const trimmedName = (name || '').trim();
        if (!trimmedName) {
            return res.status(400).json({ message: 'Team name is required.' });
        }

        const duplicateTeam = await Team.findOne({ _id: { $ne: team._id }, name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        if (duplicateTeam) {
            return res.status(400).json({ message: 'A team with this name already exists.' });
        }

        const validMemberIds = await User.find({ _id: { $in: members }, isApproved: true, role: { $in: ['ground', 'room'] } }).distinct('_id');

        let resolvedTeamHead = null;
        if (teamHead && validMemberIds.some((id) => String(id) === String(teamHead))) {
            resolvedTeamHead = teamHead;
        }

        team.name = trimmedName;
        team.members = validMemberIds;
        team.teamHead = resolvedTeamHead;
        await team.save();
        const populatedTeam = await Team.findById(team._id)
            .populate('members', 'username role email')
            .populate('createdBy', 'username')
            .populate('teamHead', 'username role email');
        res.status(200).json(populatedTeam);
    } catch (error) {
        console.error('Error updating team:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Team not found.' });
        }
        res.status(500).json({ message: 'Failed to update team.' });
    }
});

app.delete('/api/teams/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can delete teams.' });
        }

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        await Team.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Team deleted.' });
    } catch (error) {
        console.error('Error deleting team:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Team not found.' });
        }
        res.status(500).json({ message: 'Failed to delete team.' });
    }
});
// --- End Teams CRUD ---

app.get('/api/users', async (_req, res) => {
    try {
        const users = await User.find({ isApproved: true }).select('username role email');
        const onlineUserIds = new Set(
            Array.from(socketToUserId.values()).map((id) => String(id))
        );
        const result = users.map((user) => {
            const isOnline = onlineUserIds.has(String(user._id));
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: isOnline ? 'online' : 'offline',
            };
        });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ message: 'Failed to fetch users.' });
    }
});
// -------------------------------------------------


// --- Meeting Routes ---
// Create a new meeting (HEAD only)
app.post('/api/meetings', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can create meetings.' });
        }

        const { title, description, targetRole, meetingTime, meetingLink } = req.body;

        if (!title || !targetRole || !meetingTime) {
            return res.status(400).json({ message: 'Title, targetRole and meetingTime are required.' });
        }

        if (!['all', 'head', 'room', 'ground'].includes(targetRole)) {
            return res.status(400).json({ message: 'Invalid target role for meeting.' });
        }

        const creator = await User.findById(req.user.id).select('username');
        const createdBy = creator ? creator.username : 'Unknown';

        const meeting = new Meeting({
            title,
            description: description || '',
            createdBy,
            targetRole,
            meetingTime: new Date(meetingTime),
            meetingLink: meetingLink || '',
        });

        await meeting.save();

        // Emit meeting over Socket.IO — always include heads so organizers see it too
        if (targetRole === 'all') {
            io.emit('new-meeting', meeting);
        } else {
            io.to(targetRole).emit('new-meeting', meeting);
            if (targetRole !== 'head') {
                io.to('head').emit('new-meeting', meeting);
            }
        }

        res.status(201).json(meeting);
    } catch (error) {
        console.error('Error creating meeting:', error.message);
        res.status(500).json({ message: 'Failed to create meeting.' });
    }
});

// Get meetings visible to the current user
app.get('/api/meetings', auth, async (req, res) => {
    try {
        const userRole = req.user.role;
        // Heads manage meetings — show all of them. Other roles only see theirs + "all".
        const meetings =
            userRole === 'head'
                ? await Meeting.find().sort({ meetingTime: 1 })
                : await Meeting.find({
                      $or: [{ targetRole: 'all' }, { targetRole: userRole }],
                  }).sort({ meetingTime: 1 });

        res.status(200).json(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error.message);
        res.status(500).json({ message: 'Failed to fetch meetings.' });
    }
});
// -------------------------------------------------

// Delete meeting (HEAD only)
app.delete('/api/meetings/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can delete meetings.' });
        }

        const { id } = req.params;
        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found.' });
        }

        await Meeting.deleteOne({ _id: id });

        // Inform all connected clients so they remove it from their lists
        io.emit('meeting-deleted', id);

        res.status(200).json({ message: 'Meeting deleted.' });
    } catch (error) {
        console.error('Error deleting meeting:', error.message);
        res.status(500).json({ message: 'Failed to delete meeting.' });
    }
});
// -------------------------------------------------


app.use('/api/auth', authRoutes.router); // Use Auth Routes

// --- MODIFIED: Listen on http server, not app directly ---
server.listen(port, () => { // Change app.listen to server.listen
    console.log(`Server running on port ${port}`);
    console.log('Socket.IO is listening...');
});