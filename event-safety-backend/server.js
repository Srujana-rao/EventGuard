require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path'); // Node.js path module, needed for file paths

const authRoutes = require('./routes/auth'); // Import authentication routes
const User = require('./models/User'); // NEW: Import User model for Socket.IO auth
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

// 2. For AI analysis: Memory storage (AI needs buffer directly)
const aiAnalysisStorage = multer.memoryStorage();
const uploadAiImage = multer({ storage: aiAnalysisStorage });
// -------------------------------------------------------------------------

// Middleware
app.use(cors()); // Enable CORS for all routes (important for frontend communication)
app.use(express.json()); // Enable JSON body parsing for incoming requests
// --- Serve static files from the 'uploads' directory ---
// Makes files in 'uploads' accessible via /uploads URL from the frontend
app.use('/uploads', express.static('uploads'));
// -----------------------------------------------------------

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schema and Model for Incidents
const incidentSchema = new mongoose.Schema({
    type: { type: String, required: true },
    location: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    visionLabels: { type: Array, default: [] }, // Will store labels from Python AI later
    imageUrl: { type: String } // To store the URL of the uploaded image for incidents
}, { timestamps: true });
const Incident = mongoose.model('Incident', incidentSchema);

// --- NEW: Define Mongoose Schema and Model for Alerts ---
const alertSchema = new mongoose.Schema({
    message: { type: String, trim: true },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'audio', null], default: null },
    sender: { type: String, required: true },
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

            // Store user info on the socket object
            socket.user = { id: user.id, username: user.username, role: user.role };
            socketToUserId.set(socket.id, user.id);
            userIdToSocketId.set(user.id, socket.id);

            // Add socket to appropriate role set
            connectedUsersByRole[user.role].add(socket.id);
            console.log(`User ${user.username} (${user.role}) authenticated via Socket.IO. Current connections:`, {
                head: connectedUsersByRole.head.size,
                room: connectedUsersByRole.room.size,
                ground: connectedUsersByRole.ground.size,
            });
            // Let the client know authentication was successful
            socket.emit('authenticated', { status: true, user: { id: user.id, username: user.username, role: user.role } });

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
            sender: socket.user.username,
            senderRole: socket.user.role,
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
        }
    });
});
// ------------------------------------------------------------

// --- API Routes ---
app.get('/', (req, res) => {
    res.send('Event Safety Backend API is running!');
});

// UPDATED: Incident POST route to accept and save imageUrl
app.post('/api/incidents', async (req, res) => {
    try {
        const { type, location, imageUrl } = req.body; // NEW: Destructure imageUrl
        if (!type || !location) {
            return res.status(400).json({ message: 'Type and location are required.' });
        }
        const newIncident = new Incident({ type, location, imageUrl }); // Pass imageUrl to model
        await newIncident.save();
        io.emit('new-incident', newIncident); // Emit to all, now including imageUrl
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

// AI Image Analysis Route (uses uploadAiImage for memory storage)
app.post('/api/analyze-image', uploadAiImage.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image file uploaded.');
    }

    try {
        console.log('Sending image to Python AI microservice...');

        const nodeFormData = new FormData();
        nodeFormData.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const pythonAiResponse = await axios.post('http://localhost:5001/analyze-image', nodeFormData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${nodeFormData._boundary}`,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        const aiResults = pythonAiResponse.data;
        console.log('Received AI results from Python:', aiResults.detections);

        res.json({
            message: 'Image analyzed successfully by Python AI microservice!',
            detections: aiResults.detections,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error('Error calling Python AI microservice:', error.message);
        if (error.response) {
            console.error('Python AI Service Response Error:', error.response.status, error.response.data);
            res.status(error.response.status).json({
                message: 'Error from Python AI microservice.',
                details: error.response.data
            });
        } else if (error.request) {
            console.error('No response received from Python AI Service. Is it running on port 5001?', error.request);
            res.status(500).json({
                message: 'No response from Python AI microservice. Is it running on port 5001?',
                error: error.message
            });
        } else {
            res.status(500).json({
                message: 'Failed to send request to Python AI microservice.',
                error: error.message
            });
        }
    }
});

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


app.use('/api/auth', authRoutes.router); // Use Auth Routes

// --- MODIFIED: Listen on http server, not app directly ---
server.listen(port, () => { // Change app.listen to server.listen
    console.log(`Server running on port ${port}`);
    console.log('Socket.IO is listening...');
});