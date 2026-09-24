"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomManager = exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const room_manager_1 = require("./rooms/room.manager");
const socket_handlers_1 = require("./socket/socket.handlers");
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
exports.server = server;
// Zero TCP buffering latency (disable Nagle's algorithm)
server.on('connection', (socket) => {
    socket.setNoDelay(true);
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 15000,
    transports: ['websocket', 'polling'], // Supports direct pure WebSocket connections
    perMessageDeflate: false, // Avoid CPU compression overhead for instant buzzer hits
    httpCompression: false,
    allowEIO3: true,
});
exports.io = io;
const roomManager = new room_manager_1.RoomManager();
exports.roomManager = roomManager;
// Register real-time socket events
(0, socket_handlers_1.registerSocketHandlers)(io, roomManager);
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Health-check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});
// Active rooms inspection endpoint
app.get('/api/rooms', (_req, res) => {
    try {
        const rooms = Array.from(roomManager.rooms.values()).map((r) => ({
            roomId: r.roomId,
            roundStatus: r.roundStatus,
            currentRound: r.currentRound,
            participantCount: r.participants ? r.participants.size : 0,
            createdAt: r.createdAt,
        }));
        res.json({ success: true, count: rooms.length, rooms });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Network connection & URLs hub endpoint
app.get('/api/network-info', (_req, res) => {
    try {
        let tunnelUrl = process.env.PUBLIC_SERVER_URL ||
            (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '')}` : '') ||
            (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');
        if (!tunnelUrl) {
            const urlFile = path_1.default.join(__dirname, '..', 'public_url.txt');
            if (fs_1.default.existsSync(urlFile)) {
                const saved = fs_1.default.readFileSync(urlFile, 'utf8').trim();
                if (saved.startsWith('https://') || saved.startsWith('http://')) {
                    tunnelUrl = saved;
                }
            }
        }
        if (!tunnelUrl) {
            tunnelUrl = 'https://loud-ends-eva-observed.trycloudflare.com';
        }
        const activeRooms = Array.from(roomManager.rooms.keys());
        res.json({
            success: true,
            publicUrl: tunnelUrl,
            localWifiUrl: 'http://10.14.241.188:3000',
            localhostUrl: 'http://localhost:3000',
            activeRooms,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Questions REST endpoints
app.get('/api/questions', (_req, res) => {
    res.json({
        success: true,
        questions: socket_handlers_1.sharedQuestions,
        settings: socket_handlers_1.sharedGameSettings,
        activeIndex: socket_handlers_1.activeQuestionIndex,
        isAnswerRevealed: socket_handlers_1.isAnswerRevealed,
        revealedClueCount: socket_handlers_1.revealedClueCount,
    });
});
app.post('/api/questions', (req, res) => {
    try {
        const { questions, settings } = req.body || {};
        if (Array.isArray(questions)) {
            socket_handlers_1.sharedQuestions.length = 0;
            socket_handlers_1.sharedQuestions.push(...questions);
        }
        if (settings && typeof settings === 'object') {
            Object.assign(socket_handlers_1.sharedGameSettings, settings);
        }
        io.emit('questions_updated', {
            questions: socket_handlers_1.sharedQuestions,
            settings: socket_handlers_1.sharedGameSettings,
        });
        res.json({
            success: true,
            questions: socket_handlers_1.sharedQuestions,
            settings: socket_handlers_1.sharedGameSettings,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// 1. Serve React Website Admin Portal under /admin
const reactAdminPath = path_1.default.join(__dirname, '..', '..', 'admin-portal', 'dist');
if (fs_1.default.existsSync(reactAdminPath)) {
    console.log(`💻 Serving React Website Admin Portal from: ${reactAdminPath}`);
    app.use('/admin', express_1.default.static(reactAdminPath));
    app.get('/admin*', (_req, res) => {
        res.sendFile(path_1.default.join(reactAdminPath, 'index.html'));
    });
}
// 2. Serve Flutter Web app for mobile participants across the internet
const flutterWebPath = path_1.default.join(__dirname, '..', '..', 'build', 'web');
if (fs_1.default.existsSync(flutterWebPath)) {
    console.log(`📱 Serving Flutter Mobile/Web app from: ${flutterWebPath}`);
    app.use(express_1.default.static(flutterWebPath));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(flutterWebPath, 'index.html'));
    });
}
else {
    app.get('/', (_req, res) => {
        res.json({
            name: 'Real-time Multiplayer Buzzer Server',
            status: 'online',
            timestamp: new Date().toISOString(),
        });
    });
}
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`=========================================`);
        console.log(`🎯 BUZZER SERVER RUNNING ON PORT ${PORT}`);
        console.log(`📡 WebSocket ready for connections`);
        console.log(`=========================================`);
    });
}
