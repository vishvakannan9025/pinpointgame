# 🎯 PinPoint Buzzer & Clue Game System

A real-time, low-latency multiplayer buzzer and clue-based quiz competition system designed for college events, corporate arenas, and inter-school symposiums.

---

## 🏗️ Architecture Overview

The system consists of three integrated components designed to operate seamlessly across different networks (mobile data 4G/5G, university Wi-Fi, home internet):

```
┌─────────────────────────────────┐
│     📱 Flutter Buzzer App       │  (Participants: Android APK, iOS, Web, Windows)
│  Ultra-low Latency Buzzer Press │
└────────────────┬────────────────┘
                 │ WebSocket (WSS) via Cloudflare Tunnel / Public Internet
                 ▼
┌─────────────────────────────────┐
│     ⚡ Node.js Realtime Server   │  (Port 3000)
│  - Atomic O(1) Buzzer Engine    │  - Millisecond Offset Recording
│  - 4-Clue Progressive Manager   │  - Auto-Tunnel Synchronization
└────────────────┬────────────────┘
                 │ Realtime Socket.IO Sync
                 ▼
┌─────────────────────────────────┐
│   🖥️ React Website Admin Portal  │  (Port 5173 / Vercel)
│  - Live Buzzer Ranking Table    │  - 4-Clue Question Bank Manager
│  - Fullscreen Projector Display │  - Network QR & Connectivity Hub
└─────────────────────────────────┘
```

---

## ✨ Key Features

### 1. ⚡ Server-Authoritative Atomic Buzzer
- **Zero Client Clock Reliance**: Time offsets are calculated atomically on the server (Rank 1 at 0ms, followed by exact millisecond differences for 2nd, 3rd, etc.).
- **Anti-Cheat & Lockouts**: Immediate lock on buzz press; prevents double-taps or race conditions.
- **Round Resets & Instant Unlocks**: Coordinator can reset or re-enable the buzzer in real time.

### 2. 🔍 4-Clue Progressive Challenge Flow
- Replaces traditional single-question displays with an engaging progressive reveal:
  $$\text{Clue 1} \longrightarrow \text{Next Clue} \longrightarrow \text{Clue 2} \longrightarrow \text{Next Clue} \longrightarrow \text{Clue 3} \longrightarrow \text{Next Clue} \longrightarrow \text{Clue 4} \longrightarrow \text{Reveal Answer}$$
- Synchronized in real time between the Admin Console and the Fullscreen Projector Stage.

### 3. 🌐 Cross-Network & Public Internet Ready
- **No Local IP Restrictions**: Players do not need to be on the same Wi-Fi network. Works across any 4G/5G carrier, campus Wi-Fi, or different ISPs.
- **Cloudflare Tunnel Built-in**: Auto-generates a secure public HTTPS/WSS URL (`trycloudflare.com`) and synchronizes client configuration automatically.
- **Persistent Arena**: Uses permanent room code `PINPOINT` for immediate zero-config team onboarding.

### 4. 📽️ Fullscreen Projector Stage View
- Designed for auditorium projectors and secondary presentation monitors.
- Dynamic responsive clue cards, large typography, sound effects, and confetti celebrations on winner declarations.

---

## 📁 Repository Structure

```
pinpointgame/
├── admin-portal/              # React 18 + Vite Admin Dashboard
│   ├── src/
│   │   ├── components/       # LiveStage, QuestionManager, ProjectorStageView, NetworkSettings
│   │   ├── context/          # AdminContext (Realtime Socket.IO state)
│   │   └── services/         # Socket client connection manager
│   └── package.json
│
├── server/                    # Node.js + TypeScript Realtime Server
│   ├── src/
│   │   ├── buzzer/           # BuzzerEngine (Atomic check-and-commit)
│   │   ├── rooms/            # RoomManager (Default PINPOINT arena)
│   │   ├── socket/           # WebSocket event handlers (Clues, Buzzer, Admin)
│   │   └── server.ts         # Express server & REST endpoints
│   ├── scripts/
│   │   └── tunnel.js         # Cloudflare quick-tunnel runner & auto-sync
│   ├── cloudflared.exe       # Cloudflare Tunnel binary
│   └── package.json
│
├── lib/                       # Flutter Participant Buzzer Application
│   ├── models/               # Room, Participant, BuzzerResult data models
│   ├── screens/              # JoinRoomScreen, ParticipantRoomScreen, Projector
│   ├── services/             # SocketService, RoomService, QuestionService
│   ├── utils/                # AppConstants (Server URLs, Colors, Theme)
│   └── main.dart             # Application root
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Flutter SDK** (v3.22+ recommended for mobile/desktop builds)

---

### 2. Start the Backend Server & Public Tunnel

Open a terminal in `server/`:

```powershell
cd server

# Install dependencies (first time only)
npm install

# Build TypeScript
npm run build

# Start the Node.js server (Port 3000)
npm run start
```

In a second terminal, start the **Cloudflare Public Tunnel** (for cross-network access):

```powershell
cd server
node scripts/tunnel.js
```

> **Note**: `scripts/tunnel.js` automatically detects the public `https://*.trycloudflare.com` URL, writes it to `public_url.txt`, and updates `lib/utils/constants.dart`.

---

### 3. Start the Admin Portal

Open a terminal in `admin-portal/`:

```powershell
cd admin-portal

# Install dependencies (first time only)
npm install

# Start Vite dev server (Port 5173)
npm run dev
```

- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Enter the default Admin Passcode: `admin123`.

---

### 4. Run the Flutter Buzzer App

#### For Windows Desktop:
```powershell
flutter run -d windows
```

#### For Android Device / Emulator:
```powershell
flutter run -d android
```

#### To Build a Production Android APK:
```powershell
flutter build apk --release
```
The APK will be generated at `build/app/outputs/flutter-apk/app-release.apk`. Participants can install this APK and join from any mobile network (4G/5G).

---

## 🔑 Default Credentials & Room Settings

| Setting | Default Value | Description |
| :--- | :--- | :--- |
| **Admin Passcode** | `admin123` | Unlocks host controls in the Admin Portal |
| **Default Room ID** | `PINPOINT` | Permanent room code pre-configured for instant play |
| **Local Server Port**| `3000` | Node.js Express & Socket.IO backend |
| **Admin Portal Port**| `5173` | React Vite dashboard |

---

## 🎮 How to Run a Quiz Competition

1. **Host Setup**:
   - Open the **Admin Portal** at [http://localhost:5173](http://localhost:5173).
   - Navigate to the **Network & QR** tab to view the live QR code and public join link.
   - Open the **Projector** tab in a separate window and drag it to the stage display / second monitor (press `F11` for fullscreen).

2. **Team Registration**:
   - Participants scan the QR code or open the Flutter app.
   - Enter their **Team Name** and join the arena.

3. **Gameplay**:
   - The coordinator selects a challenge in the **Questions** tab or uses the **Live Stage**.
   - Click **Reveal Clue 1**, then sequentially click **Next Clue** to reveal Clues 2, 3, and 4.
   - Participants press their big red buzzer as soon as they know the answer.
   - The server instantly records and ranks buzzes with exact millisecond precision.
   - Click **Reveal Answer** to display the solution and trigger the celebration!
