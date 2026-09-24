import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/room.manager';
import {
  registerSocketHandlers,
  sharedQuestions,
  sharedGameSettings,
  activeQuestionIndex,
  isAnswerRevealed,
  revealedClueCount,
} from './socket/socket.handlers';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Zero TCP buffering latency (disable Nagle's algorithm)
server.on('connection', (socket) => {
  socket.setNoDelay(true);
});

const io = new Server(server, {
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

const roomManager = new RoomManager();

// Register real-time socket events
registerSocketHandlers(io, roomManager);

import path from 'path';
import fs from 'fs';

// Health-check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Active rooms inspection endpoint
app.get('/api/rooms', (_req: Request, res: Response) => {
  try {
    const rooms = Array.from((roomManager as any).rooms.values()).map((r: any) => ({
      roomId: r.roomId,
      roundStatus: r.roundStatus,
      currentRound: r.currentRound,
      participantCount: r.participants ? r.participants.size : 0,
      createdAt: r.createdAt,
    }));
    res.json({ success: true, count: rooms.length, rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Network connection & URLs hub endpoint
app.get('/api/network-info', (_req: Request, res: Response) => {
  try {
    let tunnelUrl = process.env.PUBLIC_SERVER_URL ||
      (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '')}` : '') ||
      (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');

    if (!tunnelUrl) {
      const urlFile = path.join(__dirname, '..', 'public_url.txt');
      if (fs.existsSync(urlFile)) {
        const saved = fs.readFileSync(urlFile, 'utf8').trim();
        if (saved.startsWith('https://') || saved.startsWith('http://')) {
          tunnelUrl = saved;
        }
      }
    }

    if (!tunnelUrl) {
      tunnelUrl = 'https://loud-ends-eva-observed.trycloudflare.com';
    }

    const activeRooms = Array.from((roomManager as any).rooms.keys());

    res.json({
      success: true,
      publicUrl: tunnelUrl,
      localWifiUrl: 'http://10.14.241.188:3000',
      localhostUrl: 'http://localhost:3000',
      activeRooms,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Questions REST endpoints
app.get('/api/questions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    questions: sharedQuestions,
    settings: sharedGameSettings,
    activeIndex: activeQuestionIndex,
    isAnswerRevealed,
    revealedClueCount,
  });
});

app.post('/api/questions', (req: Request, res: Response) => {
  try {
    const { questions, settings } = req.body || {};
    if (Array.isArray(questions)) {
      sharedQuestions.length = 0;
      sharedQuestions.push(...questions);
    }
    if (settings && typeof settings === 'object') {
      Object.assign(sharedGameSettings, settings);
    }
    io.emit('questions_updated', {
      questions: sharedQuestions,
      settings: sharedGameSettings,
    });
    res.json({
      success: true,
      questions: sharedQuestions,
      settings: sharedGameSettings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Serve React Website Admin Portal under /admin
const reactAdminPath = path.join(__dirname, '..', '..', 'admin-portal', 'dist');
if (fs.existsSync(reactAdminPath)) {
  console.log(`💻 Serving React Website Admin Portal from: ${reactAdminPath}`);
  app.use('/admin', express.static(reactAdminPath));
  app.get('/admin*', (_req: Request, res: Response) => {
    res.sendFile(path.join(reactAdminPath, 'index.html'));
  });
}

// 2. Serve Flutter Web app for mobile participants across the internet
const flutterWebPath = path.join(__dirname, '..', '..', 'build', 'web');
if (fs.existsSync(flutterWebPath)) {
  console.log(`📱 Serving Flutter Mobile/Web app from: ${flutterWebPath}`);
  app.use(express.static(flutterWebPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(flutterWebPath, 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
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

export { app, server, io, roomManager };
