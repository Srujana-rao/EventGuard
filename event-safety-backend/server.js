require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const authRoutes = require('./routes/auth');
const User = require('./models/User');
const Meeting = require('./models/Meeting');
const Team = require('./models/Team');
const Counter = require('./models/Counter');
const SafetyIncident = require('./models/SafetyIncident');
const WorkingDay = require('./models/WorkingDay');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const auth = require('./routes/auth').auth;

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const mediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const uploadMediaToDisk = multer({ storage: mediaStorage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const session = require('express-session');
const passport = require('./passport');

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

const incidentSchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String, default: '' },
    location: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    visionLabels: { type: Array, default: [] },
    imageUrl: { type: String },
}, { timestamps: true });
const Incident = mongoose.model('Incident', incidentSchema);

// Priority now uses the same low/medium/critical vocabulary as Incidents
// (was previously info/important/urgent)
const alertSchema = new mongoose.Schema({
    message: { type: String, trim: true },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'audio', null], default: null },
    sender: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    senderRole: { type: String, required: true },
    targetRole: { type: String, enum: ['all', 'head', 'room', 'ground', null], default: null },
    priority: { type: String, enum: ['critical', 'medium', 'low'], default: 'low' },
    locationTag: { type: String, trim: true, default: '' },
    workingDate: { type: String, default: null, index: true },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
const Alert = mongoose.model('Alert', alertSchema);

// --- Incident case helpers ---
function getTodayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

async function generateIncidentId(dateStr) {
    const counter = await Counter.findOneAndUpdate(
        { name: `incident-${dateStr}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return `INC-${counter.seq}`;
}

// Alert priority (low/medium/critical) already matches Incident priority
// vocabulary — just needs the casing SafetyIncident's enum expects.
function mapAlertPriorityToIncidentPriority(alertPriority) {
    switch (alertPriority) {
        case 'critical':
            return 'Critical';
        case 'medium':
            return 'Medium';
        case 'low':
        default:
            return 'Low';
    }
}
// -----------------------------------------

const connectedUsersByRole = {
    head: new Set(),
    room: new Set(),
    ground: new Set(),
};
const socketToUserId = new Map();
const userIdToSocketId = new Map();

function emitToRole(role, event, payload) {
    const socketIds = connectedUsersByRole[role];
    if (!socketIds) return;
    for (const socketId of socketIds) {
        io.to(socketId).emit(event, payload);
    }
}

function emitToUserIds(userIds, event, payload) {
    userIds.forEach((userId) => {
        const socketId = userIdToSocketId.get(String(userId));
        if (socketId) {
            io.to(socketId).emit(event, payload);
        }
    });
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.user.id);

            if (!user || !user.isApproved) {
                console.warn(`Socket auth failed: User ${decoded.user.id} not found or not approved.`);
                socket.disconnect();
                return;
            }

            const userId = String(user._id);
            socket.user = { id: userId, username: user.username, role: user.role };
            socketToUserId.set(socket.id, userId);
            userIdToSocketId.set(userId, socket.id);

            connectedUsersByRole[user.role].add(socket.id);
            socket.join(user.role);
            console.log(`User ${user.username} (${user.role}) authenticated via Socket.IO. Current connections:`, {
                head: connectedUsersByRole.head.size,
                room: connectedUsersByRole.room.size,
                ground: connectedUsersByRole.ground.size,
            });
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

    socket.on('send-alert', async (alertData) => {
        if (!socket.user) {
            console.warn(`Unauthenticated user ${socket.id} tried to send alert.`);
            return;
        }

        const { targetRole, message, mediaUrl, mediaType, priority, locationTag } = alertData;

        try {
            const today = getTodayString();
            const workingDayDoc = await WorkingDay.findOne({ realDate: today });
            const activeWorkingDate = workingDayDoc?.workingDate || today;
            const activeEventName = workingDayDoc?.eventName || '';

            const fullAlert = {
                message,
                sender: alertData.sender || socket.user.username,
                senderId: alertData.senderId || socket.user.id,
                senderRole: alertData.senderRole || socket.user.role,
                timestamp: new Date(),
                mediaUrl,
                mediaType,
                targetRole,
                priority,
                locationTag,
                workingDate: activeWorkingDate,
            };

            console.log(`Alert from ${fullAlert.sender} (${fullAlert.senderRole}) (Target: ${targetRole || 'All'}) (Priority: ${priority || 'low'}) (Location: ${locationTag || 'N/A'}) (Working Date: ${activeWorkingDate}):`, fullAlert.message);

            const newAlert = new Alert(fullAlert);
            await newAlert.save();
            console.log('Alert saved to DB:', newAlert._id);

            const emitPayload = { ...fullAlert, _id: newAlert._id, timestamp: fullAlert.timestamp.toISOString() };

            if (targetRole && connectedUsersByRole[targetRole]) {
                console.log(`Emitting alert to ${targetRole} members.`);
                for (const targetSocketId of connectedUsersByRole[targetRole]) {
                    io.to(targetSocketId).emit('receive-alert', emitPayload);
                }
            } else {
                console.log('Emitting alert to all authenticated members (default).');
                for (const roleSet of Object.values(connectedUsersByRole)) {
                    for (const targetSocketId of roleSet) {
                        io.to(targetSocketId).emit('receive-alert', emitPayload);
                    }
                }
            }

            try {
                const incidentId = await generateIncidentId(activeWorkingDate);
                const newIncidentCase = new SafetyIncident({
                    incidentId,
                    type: fullAlert.message || 'Incident',
                    location: fullAlert.locationTag || '',
                    priority: mapAlertPriorityToIncidentPriority(fullAlert.priority),
                    status: 'Open',
                    reportedBy: fullAlert.sender,
                    reportedByRole: fullAlert.senderRole,
                    sourceAlertId: newAlert._id,
                    incidentDate: activeWorkingDate,
                    eventName: activeEventName,
                });
                await newIncidentCase.save();

                emitToRole('head', 'incident-case-created', newIncidentCase);
                console.log('Incident case auto-created:', newIncidentCase.incidentId, 'for date', activeWorkingDate);
            } catch (incidentErr) {
                console.error('Error auto-creating incident case:', incidentErr.message);
            }

        } catch (error) {
            console.error('Error saving or emitting alert:', error.message);
        }
    });

    // --- Chat ---
    socket.on('send-chat-message', async ({ receiverId, text }) => {
        if (!socket.user) return;
        if (!receiverId || !text || !text.trim()) return;

        try {
            const newMessage = new Message({
                sender: socket.user.id,
                receiver: receiverId,
                text: text.trim(),
            });
            await newMessage.save();

            const payload = {
                _id: newMessage._id,
                sender: socket.user.id,
                receiver: receiverId,
                text: newMessage.text,
                read: false,
                createdAt: newMessage.createdAt,
            };

            // Deliver to both sides so every open tab of sender/receiver updates live
            emitToUserIds([receiverId, socket.user.id], 'receive-chat-message', payload);

            const unreadTotal = await Message.countDocuments({ receiver: receiverId, read: false });
            emitToUserIds([receiverId], 'chat-unread-update', { total: unreadTotal });
        } catch (error) {
            console.error('Error sending chat message:', error.message);
        }
    });
    // --- End Chat ---

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (socket.user) {
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

authRoutes.setIo(io);

app.get('/', (req, res) => {
    res.send('Event Safety Backend API is running!');
});

app.post('/api/incidents', async (req, res) => {
    try {
        const { type, location, imageUrl, description } = req.body;
        if (!type || !location) {
            return res.status(400).json({ message: 'Type and location are required.' });
        }

        let newIncident = new Incident({ type, location, imageUrl, description });
        await newIncident.save();

        io.emit('new-incident', newIncident);
        res.status(201).json(newIncident);
    } catch (error) {
        console.error('Error adding incident:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/incidents/:id', auth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ msg: 'Incident not found' });
        }

        await Incident.deleteOne({ _id: req.params.id });
        
        io.emit('incident-deleted', req.params.id);

        res.json({ msg: 'Incident removed' });
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
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

app.post('/api/alert-media-upload', uploadMediaToDisk.single('alertMedia'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No media file uploaded.' });
    }
    const mediaUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ message: 'Media uploaded successfully!', mediaUrl: mediaUrl });
});

app.get('/api/alerts', async (req, res) => {
    try {
        const { date } = req.query;
        if (date) {
            const alerts = await Alert.find({ workingDate: date }).sort({ createdAt: 1 }).limit(500);
            return res.status(200).json(alerts);
        }
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error fetching historical alerts:', error.message);
        res.status(500).json({ message: 'Failed to fetch historical alerts.' });
    }
});

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

// --- Working Day ---
app.get('/api/working-day/current', auth, async (req, res) => {
    try {
        const today = getTodayString();
        const doc = await WorkingDay.findOne({ realDate: today });
        res.status(200).json(doc || null);
    } catch (error) {
        console.error('Error fetching current working day:', error.message);
        res.status(500).json({ message: 'Failed to fetch current working day.' });
    }
});

app.post('/api/working-day', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can set the working date.' });
        }

        const { workingDate, eventName } = req.body;
        if (!workingDate) {
            return res.status(400).json({ message: 'workingDate is required.' });
        }

        const today = getTodayString();
        const doc = await WorkingDay.findOneAndUpdate(
            { realDate: today },
            { workingDate, eventName: eventName || '', setBy: req.user.id },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        io.emit('working-day-changed', doc);

        res.status(200).json(doc);
    } catch (error) {
        console.error('Error setting working day:', error.message);
        res.status(500).json({ message: 'Failed to set working day.' });
    }
});

app.get('/api/working-day/by-date', auth, async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'date query parameter is required.' });
        }
        const doc = await WorkingDay.findOne({ workingDate: date }).sort({ createdAt: -1 });
        res.status(200).json(doc || null);
    } catch (error) {
        console.error('Error fetching working day by date:', error.message);
        res.status(500).json({ message: 'Failed to fetch working day.' });
    }
});
// --- End Working Day ---

// --- Incident Management (SafetyIncident) ---
app.get('/api/incident-reports', auth, async (req, res) => {
    try {
        const filter = {};
        if (req.query.date) {
            filter.incidentDate = req.query.date;
        }

        const incidents = await SafetyIncident.find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: 'assignedTeam',
                select: 'name members teamHead',
                populate: [
                    { path: 'members', select: 'username role' },
                    { path: 'teamHead', select: 'username role' },
                ],
            });
        res.status(200).json(incidents);
    } catch (error) {
        console.error('Error fetching incident reports:', error.message);
        res.status(500).json({ message: 'Failed to fetch incident reports.' });
    }
});

app.get('/api/incident-reports/summary', auth, async (req, res) => {
    try {
        if (req.user.role === 'head') {
            const pending = await SafetyIncident.countDocuments({ status: { $ne: 'Resolved' } });
            return res.status(200).json({ pending });
        }

        const myTeam = await Team.findOne({ members: req.user.id });
        if (!myTeam) {
            return res.status(200).json({ pending: 0 });
        }

        const pending = await SafetyIncident.countDocuments({
            assignedTeam: myTeam._id,
            status: { $ne: 'Resolved' },
        });
        res.status(200).json({ pending });
    } catch (error) {
        console.error('Error fetching incident summary:', error.message);
        res.status(500).json({ message: 'Failed to fetch incident summary.' });
    }
});

app.patch('/api/incident-reports/:id/assign', auth, async (req, res) => {
    try {
        if (req.user.role !== 'head') {
            return res.status(403).json({ message: 'Only head users can assign incidents.' });
        }

        const { teamId } = req.body;
        if (!teamId) {
            return res.status(400).json({ message: 'teamId is required.' });
        }

        const incidentCase = await SafetyIncident.findById(req.params.id);
        if (!incidentCase) {
            return res.status(404).json({ message: 'Incident not found.' });
        }

        const team = await Team.findById(teamId).populate('members', 'username role').populate('teamHead', 'username role');
        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        incidentCase.assignedTeam = team._id;
        incidentCase.status = 'Assigned';
        await incidentCase.save();

        const populatedIncident = await SafetyIncident.findById(incidentCase._id).populate({
            path: 'assignedTeam',
            select: 'name members teamHead',
            populate: [
                { path: 'members', select: 'username role' },
                { path: 'teamHead', select: 'username role' },
            ],
        });

        const notifyIds = new Set();
        (team.members || []).forEach((m) => notifyIds.add(String(m._id)));
        if (team.teamHead) notifyIds.add(String(team.teamHead._id));

        emitToUserIds(notifyIds, 'incident-assigned', populatedIncident);
        emitToUserIds(notifyIds, 'incident-case-updated', populatedIncident);
        emitToRole('head', 'incident-case-updated', populatedIncident);

        res.status(200).json(populatedIncident);
    } catch (error) {
        console.error('Error assigning incident:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Incident not found.' });
        }
        res.status(500).json({ message: 'Failed to assign incident.' });
    }
});

app.patch('/api/incident-reports/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status transition requested.' });
        }

        const incidentCase = await SafetyIncident.findById(req.params.id).populate({
            path: 'assignedTeam',
            select: 'name members teamHead',
            populate: [
                { path: 'members', select: 'username role' },
                { path: 'teamHead', select: 'username role' },
            ],
        });

        if (!incidentCase) {
            return res.status(404).json({ message: 'Incident not found.' });
        }

        if (!incidentCase.assignedTeam) {
            return res.status(400).json({ message: 'Incident has not been assigned to a team yet.' });
        }

        const team = incidentCase.assignedTeam;
        const memberIds = (team.members || []).map((m) => String(m._id));
        const isTeamMember = memberIds.includes(String(req.user.id));
        const isTeamHead = team.teamHead && String(team.teamHead._id) === String(req.user.id);

        if (status === 'In Progress') {
            if (!isTeamMember && !isTeamHead) {
                return res.status(403).json({ message: 'Only assigned team members can start work on this incident.' });
            }
            if (incidentCase.status !== 'Assigned') {
                return res.status(400).json({ message: 'Incident must be Assigned before it can move to In Progress.' });
            }
            incidentCase.status = 'In Progress';
        }

        if (status === 'Resolved') {
            if (!isTeamHead) {
                return res.status(403).json({ message: 'Only the assigned team head can mark this incident as resolved.' });
            }
            if (incidentCase.status !== 'In Progress') {
                return res.status(400).json({ message: 'Incident must be In Progress before it can be resolved.' });
            }
            incidentCase.status = 'Resolved';
            incidentCase.resolvedAt = new Date();
        }

        await incidentCase.save();

        const notifyIds = new Set();
        memberIds.forEach((id) => notifyIds.add(id));
        if (team.teamHead) notifyIds.add(String(team.teamHead._id));

        emitToUserIds(notifyIds, 'incident-case-updated', incidentCase);
        emitToRole('head', 'incident-case-updated', incidentCase);

        res.status(200).json(incidentCase);
    } catch (error) {
        console.error('Error updating incident status:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Incident not found.' });
        }
        res.status(500).json({ message: 'Failed to update incident status.' });
    }
});
// --- End Incident Management ---

// --- Chat ---
app.get('/api/chat/unread-summary', auth, async (req, res) => {
    try {
        const total = await Message.countDocuments({ receiver: req.user.id, read: false });
        res.status(200).json({ total });
    } catch (error) {
        console.error('Error fetching chat unread summary:', error.message);
        res.status(500).json({ message: 'Failed to fetch unread summary.' });
    }
});

app.get('/api/chat/unread-by-sender', auth, async (req, res) => {
    try {
        const results = await Message.aggregate([
            { $match: { receiver: new mongoose.Types.ObjectId(req.user.id), read: false } },
            { $group: { _id: '$sender', count: { $sum: 1 } } },
        ]);
        const map = {};
        results.forEach((r) => { map[String(r._id)] = r.count; });
        res.status(200).json(map);
    } catch (error) {
        console.error('Error fetching unread-by-sender:', error.message);
        res.status(500).json({ message: 'Failed to fetch unread counts.' });
    }
});

app.get('/api/chat/messages/:userId', auth, async (req, res) => {
    try {
        const otherId = req.params.userId;
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: otherId },
                { sender: otherId, receiver: req.user.id },
            ],
        }).sort({ createdAt: 1 }).limit(500);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching chat messages:', error.message);
        res.status(500).json({ message: 'Failed to fetch messages.' });
    }
});

app.patch('/api/chat/read/:userId', auth, async (req, res) => {
    try {
        const otherId = req.params.userId;
        await Message.updateMany(
            { sender: otherId, receiver: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ message: 'Messages marked as read.' });
    } catch (error) {
        console.error('Error marking messages read:', error.message);
        res.status(500).json({ message: 'Failed to mark messages read.' });
    }
});
// --- End Chat ---

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

app.get('/api/meetings', auth, async (req, res) => {
    try {
        const userRole = req.user.role;
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

        io.emit('meeting-deleted', id);

        res.status(200).json({ message: 'Meeting deleted.' });
    } catch (error) {
        console.error('Error deleting meeting:', error.message);
        res.status(500).json({ message: 'Failed to delete meeting.' });
    }
});

app.use('/api/auth', authRoutes.router);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Socket.IO is listening...');
});