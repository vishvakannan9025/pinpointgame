"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealedClueCount = exports.isAnswerRevealed = exports.activeQuestionIndex = exports.sharedGameSettings = exports.sharedQuestions = void 0;
exports.registerSocketHandlers = registerSocketHandlers;
const room_manager_1 = require("../rooms/room.manager");
const buzzer_engine_1 = require("../buzzer/buzzer.engine");
exports.sharedQuestions = [
    // --- 1. Guess the Movie (Questions 1 to 5) ---
    {
        id: 'r1-m1',
        round: 1,
        category: 'Guess the Movie',
        question: 'Guess the Movie 😉',
        clues: [
            'Clue 1',
            'Clue 2',
            'Clue 3',
            'Clue 4',
        ],
        clueImages: [
            '/clue-images/round1/Guess_the_movie_docx/img_1.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_2.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_3.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_4.jpeg',
        ],
        answer: 'Movie Challenge #1',
        answerImage: '/clue-images/round1/Guess_the_movie_docx/img_5.jpeg',
        points: 10,
    },
    {
        id: 'r1-m2',
        round: 1,
        category: 'Guess the Movie',
        question: 'Guess the Movie 😉',
        clues: [
            'Clue 1',
            'Clue 2',
            'Clue 3',
            'Clue 4',
        ],
        clueImages: [
            '/clue-images/round1/Guess_the_movie_docx/img_6.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_7.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_8.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_9.jpeg',
        ],
        answer: 'Movie Challenge #2',
        answerImage: '/clue-images/round1/Guess_the_movie_docx/img_10.jpeg',
        points: 10,
    },
    {
        id: 'r1-m3',
        round: 1,
        category: 'Guess the Movie',
        question: 'Guess the Movie 😉',
        clues: [
            'Clue 1',
            'Clue 2',
            'Clue 3',
            'Clue 4',
        ],
        clueImages: [
            '/clue-images/round1/Guess_the_movie_docx/img_11.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_12.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_13.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_14.jpeg',
        ],
        answer: 'Movie Challenge #3',
        answerImage: '/clue-images/round1/Guess_the_movie_docx/img_15.jpeg',
        points: 10,
    },
    {
        id: 'r1-m4',
        round: 1,
        category: 'Guess the Movie',
        question: 'Guess the Movie 😉',
        clues: [
            'Clue 1',
            'Clue 2',
            'Clue 3',
            'Clue 4',
        ],
        clueImages: [
            '/clue-images/round1/Guess_the_movie_docx/img_16.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_17.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_18.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_19.jpeg',
        ],
        answer: 'Movie Challenge #4',
        answerImage: '/clue-images/round1/Guess_the_movie_docx/img_20.jpeg',
        points: 10,
    },
    {
        id: 'r1-m5',
        round: 1,
        category: 'Guess the Movie',
        question: 'Guess the Movie 😉',
        clues: [
            'Clue 1',
            'Clue 2',
            'Clue 3',
            'Clue 4',
        ],
        clueImages: [
            '/clue-images/round1/Guess_the_movie_docx/img_21.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_22.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_23.jpeg',
            '/clue-images/round1/Guess_the_movie_docx/img_24.jpeg',
        ],
        answer: 'Movie Challenge #5',
        answerImage: '/clue-images/round1/Guess_the_movie_docx/img_25.jpeg',
        points: 10,
    },
    // --- 2. Guess the Hidden Category (Questions 6 to 10) ---
    {
        id: 'r1-h1',
        round: 1,
        category: 'Guess the Hidden Category',
        question: 'Guess the Hidden Category',
        clues: [
            'Clue 1 — Egg',
            'Clue 2 — Coconut',
            'Clue 3 — Turtle & Peanut',
            'Clue 4 — Seashell',
        ],
        clueImages: ['', '', '', ''],
        answer: 'Things That Have A Shell',
        points: 10,
    },
    {
        id: 'r1-h2',
        round: 1,
        category: 'Guess the Hidden Category',
        question: 'Guess the Hidden Category',
        clues: [
            'Clue 1 — Butterfly & Eagle',
            'Clue 2 — Airplane',
            'Clue 3 — Kite',
            'Clue 4 — Helicopter',
        ],
        clueImages: ['', '', '', ''],
        answer: 'Things That Can Fly',
        points: 10,
    },
    {
        id: 'r1-h3',
        round: 1,
        category: 'Guess the Hidden Category',
        question: 'Guess the Hidden Category',
        clues: [
            'Clue 1 — Sun & Fire',
            'Clue 2 — Bulb',
            'Clue 3 — Candle',
            'Clue 4 — Torch',
        ],
        clueImages: ['', '', '', ''],
        answer: 'Thing That Gives Light',
        points: 10,
    },
    {
        id: 'r1-h4',
        round: 1,
        category: 'Guess the Hidden Category',
        question: 'Guess the Hidden Category',
        clues: [
            'Clue 1 — Book & Door',
            'Clue 2 — Giftbox',
            'Clue 3 — Laptop',
            'Clue 4 — Envelope',
        ],
        clueImages: ['', '', '', ''],
        answer: 'Things That Can Be Opened',
        points: 10,
    },
    {
        id: 'r1-h5',
        round: 1,
        category: 'Guess the Hidden Category',
        question: 'Guess the Hidden Category',
        clues: [
            'Clue 1 — Apple & Football',
            'Clue 2 — Orange',
            'Clue 3 — Earth',
            'Clue 4 — Basketball',
        ],
        clueImages: ['', '', '', ''],
        answer: 'Things That Are Round',
        points: 10,
    },
    // --- 3. Guess the Cartoon (Questions 11 to 15) ---
    {
        id: 'r1-c1',
        round: 1,
        category: 'Guess the Cartoon',
        question: 'Guess the Cartoon',
        clues: [
            'Clue 1 — A normal holiday takes an unexpected turn after something falls from the sky.',
            "Clue 2 — The hero's greatest ability isn't naturally his — it comes from something attached to him.",
            'Clue 3 — One device gives him access to multiple extraterrestrial identities.',
            'Clue 4 — He transforms into aliens using the Omnitrix.',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_the_Cartoon_docx/img_1.png',
        ],
        answer: 'Ben 10',
        points: 10,
    },
    {
        id: 'r1-c2',
        round: 1,
        category: 'Guess the Cartoon',
        question: 'Guess the Cartoon',
        clues: [
            'Clue 1 — His greatest advantage comes from something he can consume, but it is not a magic potion.',
            'Clue 2 — A peaceful kingdom repeatedly finds itself depending on one unusually strong child.',
            'Clue 3 — His favourite snack is closely connected to his extraordinary strength.',
            'Clue 4 — He protects a village called Dholakpur.',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_the_Cartoon_docx/img_2.jpeg',
        ],
        answer: 'Chhota Bheem',
        points: 10,
    },
    {
        id: 'r1-c3',
        round: 1,
        category: 'Guess the Cartoon',
        question: 'Guess the Cartoon',
        clues: [
            'Clue 1 — A famous archaeologist spends his life searching for ancient objects, but his discoveries often bring dangerous magic.',
            'Clue 2 — He is supported by an energetic young niece who is always ready to join missions.',
            'Clue 3 — Many adventures involve powerful talismans that give people special abilities when collected.',
            'Clue 4 — He works with Uncle, Jade, and Section 13 to defeat the Dark Hand.',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_the_Cartoon_docx/img_3.jpeg',
        ],
        answer: 'Jackie Chan Adventures',
        points: 10,
    },
    {
        id: 'r1-c4',
        round: 1,
        category: 'Guess the Cartoon',
        question: 'Guess the Cartoon',
        clues: [
            'Clue 1 — A determined house guardian spends nearly every day trying to remove one small visitor who is cleverer than he appears.',
            'Clue 2 — Their battles regularly involve traps, frying pans, broken furniture, and chases that destroy the house.',
            'Clue 3 — Although they are enemies most of the time, they occasionally work together when a bigger danger appears.',
            'Clue 4 — One is a cat named Tom, and the other is a mouse named Jerry.',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_the_Cartoon_docx/img_4.jpeg',
        ],
        answer: 'Tom and Jerry',
        points: 10,
    },
    {
        id: 'r1-c5',
        round: 1,
        category: 'Guess the Cartoon',
        question: 'Guess the Cartoon',
        clues: [
            'Clue 1 — Two best friends live in a colourful town and always get into funny adventures.',
            'Clue 2 — One friend is strong but loves eating food more than anything else.',
            'Clue 3 — The other friend is clever and helps solve problems with smart ideas. The strong friend gets extra power after eating samosas.',
            'Clue 4 — They live in Furfuri Nagar and are called Motu and Patlu.',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_the_Cartoon_docx/img_5.jpeg',
        ],
        answer: 'Motu Patlu',
        points: 10,
    },
    // --- 4. Guess The Game (Questions 16 to 20) ---
    {
        id: 'r1-g1',
        round: 1,
        category: 'Guess The Game',
        question: 'Guess The Game',
        clues: [
            'Clue 1 — Graffiti & endless railway tracks',
            'Clue 2 — Collect gold coins while dashing at top speed',
            'Clue 3 — Ride hoverboards to bounce back after crashes',
            'Clue 4 — Escape the grumpy inspector and his dog',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_The_Game_docx/img_1.jpeg',
        ],
        answer: 'Subway Surfers',
        points: 10,
    },
    {
        id: 'r1-g2',
        round: 1,
        category: 'Guess The Game',
        question: 'Guess The Game',
        clues: [
            'Clue 1 — Drop onto a remote battle island with 50 players',
            'Clue 2 — Parachute down from the sky to pick your landing spot',
            'Clue 3 — Loot weapons, tactical gear & survive the shrinking safe zone',
            'Clue 4 — The last survivor standing claims the ultimate Booyah!',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_The_Game_docx/img_2.jpeg',
        ],
        answer: 'Free Fire',
        points: 10,
    },
    {
        id: 'r1-g3',
        round: 1,
        category: 'Guess The Game',
        question: 'Guess The Game',
        clues: [
            'Clue 1 — Match dynamic colours and numbers on your turn',
            'Clue 2 — Change play direction with Reverse and Skip cards',
            'Clue 3 — Force your rivals to pick 4 cards with Draw Four',
            'Clue 4 — Shout the game name out loud when you have only one card left!',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_The_Game_docx/img_3.jpeg',
        ],
        answer: 'UNO',
        points: 10,
    },
    {
        id: 'r1-g4',
        round: 1,
        category: 'Guess The Game',
        question: 'Guess The Game',
        clues: [
            'Clue 1 — Futuristic spaceship requiring vital maintenance tasks',
            'Clue 2 — Cooperative crewmates working together to survive',
            'Clue 3 — Sneak through vents and call emergency meetings',
            'Clue 4 — Find and vote out the sneaky Impostor before it is too late',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_The_Game_docx/img_4.jpeg',
        ],
        answer: 'Among Us',
        points: 10,
    },
    {
        id: 'r1-g5',
        round: 1,
        category: 'Guess The Game',
        question: 'Guess The Game',
        clues: [
            'Clue 1 — Build, defend and customize your fantasy village',
            'Clue 2 — Harvest gold and pink elixir from collectors',
            'Clue 3 — Train barbarians, archers, giants and dragons',
            'Clue 4 — Upgrade your townhall and lead your clan to epic war',
        ],
        clueImages: [
            '',
            '',
            '',
            '/clue-images/round1/Guess_The_Game_docx/img_5.jpeg',
        ],
        answer: 'Clash of Clans',
        points: 10,
    },
];
;
exports.sharedGameSettings = {
    gameTitle: 'Pinpoint Challenge',
    pointsPerCorrect: 10,
    timePerQuestionSeconds: 30,
    revealOptionsGradually: false,
    showAnswerAfterRound: true,
};
exports.activeQuestionIndex = 0;
exports.isAnswerRevealed = false;
exports.revealedClueCount = 1;
const pendingRoomBroadcasts = new Map();
function broadcastRoomThrottled(io, roomManager, roomId) {
    if (pendingRoomBroadcasts.has(roomId)) {
        return;
    }
    const timer = setTimeout(() => {
        pendingRoomBroadcasts.delete(roomId);
        const room = roomManager.getRoom(roomId);
        if (room) {
            io.to(roomId).emit('room_updated', {
                room: roomManager.sanitizeRoom(room),
            });
        }
    }, 100);
    pendingRoomBroadcasts.set(roomId, timer);
}
function registerSocketHandlers(io, roomManager) {
    io.on('connection', (socket) => {
        // ----------------------------------------------------
        // 0. BIND ADMIN TO DEFAULT ARENA (PINPOINT)
        // ----------------------------------------------------
        socket.on('bind_admin', (data, callback) => {
            try {
                const { passcode } = data || {};
                if (passcode && passcode !== 'admin123' && passcode !== 'admin') {
                    if (typeof callback === 'function') {
                        return callback({ success: false, error: 'Invalid admin passcode' });
                    }
                    return;
                }
                const result = roomManager.bindAdminToDefaultRoom(socket.id);
                socket.join(result.roomId);
                console.log(`👑 [Admin Bound] socket ${socket.id} bound to default room ${result.roomId}`);
                if (typeof callback === 'function') {
                    callback({
                        success: true,
                        roomId: result.roomId,
                        adminToken: result.adminToken,
                        adminId: result.adminId,
                        room: result.room,
                    });
                }
            }
            catch (err) {
                console.error(`❌ [bind_admin ERROR]: ${err.message}`);
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 1. CREATE ROOM (Admin - auto-binds to default or creates)
        // ----------------------------------------------------
        socket.on('create_room', (_, callback) => {
            try {
                const result = roomManager.createRoom(socket.id);
                socket.join(result.roomId);
                console.log(`🏠 [Room Created/Bound] ${result.roomId} for admin socket ${socket.id}`);
                if (typeof callback === 'function') {
                    callback({
                        success: true,
                        roomId: result.roomId,
                        adminToken: result.adminToken,
                        adminId: result.adminId,
                        room: result.room,
                    });
                }
            }
            catch (err) {
                console.error(`❌ [create_room ERROR]: ${err.message}`);
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 2. JOIN ROOM (Participant - defaults to PINPOINT arena)
        // ----------------------------------------------------
        socket.on('join_room', (data, callback) => {
            try {
                const { roomId, name, participantId } = data || {};
                if (!name || name.toString().trim().length === 0) {
                    if (typeof callback === 'function') {
                        return callback({
                            success: false,
                            error: 'Team Name is required.',
                        });
                    }
                    return;
                }
                const normalizedRoomId = (roomId && roomId.toString().trim().length > 0 && roomId.toString().toUpperCase() !== 'DEFAULT')
                    ? roomId.toString().trim().toUpperCase()
                    : room_manager_1.RoomManager.DEFAULT_ROOM_ID;
                const joinResult = roomManager.joinRoom(normalizedRoomId, name, socket.id, participantId);
                if (!joinResult.success) {
                    console.warn(`❌ [join_room FAILED] room ${normalizedRoomId}, name "${name}": ${joinResult.error}`);
                    if (typeof callback === 'function') {
                        return callback(joinResult);
                    }
                    return;
                }
                socket.join(normalizedRoomId);
                // Immediate direct 0ms acknowledgment to the joiner
                if (typeof callback === 'function') {
                    callback(joinResult);
                }
                // Throttled (100ms) broadcast to room to prevent O(N^2) flood during simultaneous 50-player burst
                broadcastRoomThrottled(io, roomManager, normalizedRoomId);
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 3. RECONNECT SESSION
        // ----------------------------------------------------
        socket.on('reconnect_session', (data, callback) => {
            try {
                const { roomId, role, adminToken, participantId, name } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                if (role === 'admin' && adminToken) {
                    const res = roomManager.reconnectAdmin(normalizedRoomId, adminToken, socket.id);
                    if (res.success) {
                        socket.join(normalizedRoomId);
                        io.to(normalizedRoomId).emit('host_reconnected', { room: res.room });
                        if (typeof callback === 'function')
                            callback(res);
                    }
                    else {
                        if (typeof callback === 'function')
                            callback(res);
                    }
                }
                else if (role === 'participant' && participantId && name) {
                    const res = roomManager.joinRoom(normalizedRoomId, name, socket.id, participantId);
                    if (res.success) {
                        socket.join(normalizedRoomId);
                        socket.to(normalizedRoomId).emit('room_updated', {
                            room: res.room,
                            event: 'participant_reconnected',
                            participant: res.participant,
                        });
                        if (typeof callback === 'function')
                            callback(res);
                    }
                    else {
                        if (typeof callback === 'function')
                            callback(res);
                    }
                }
                else {
                    if (typeof callback === 'function') {
                        callback({ success: false, error: 'Invalid reconnection payload.' });
                    }
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 3b. LEAVE ROOM (Graceful participant leave, retaining spot for rejoin)
        // ----------------------------------------------------
        socket.on('leave_room', (data, callback) => {
            try {
                const { roomId, participantId } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                const room = roomManager.getRoom(normalizedRoomId);
                if (room && participantId) {
                    const participant = room.participants.get(participantId);
                    if (participant) {
                        participant.isConnected = false;
                        socket.leave(normalizedRoomId);
                        socket.to(normalizedRoomId).emit('room_updated', {
                            room: roomManager.sanitizeRoom(room),
                            event: 'participant_left',
                            participant: roomManager.sanitizeParticipant(participant),
                        });
                    }
                }
                if (typeof callback === 'function') {
                    callback({ success: true });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 4. START ROUND (Admin only)
        // ----------------------------------------------------
        socket.on('start_round', (data, callback) => {
            try {
                const { roomId, adminToken } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                const result = roomManager.startRound(normalizedRoomId, adminToken);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('round_started', {
                        room: result.room,
                        round: result.room.currentRound,
                    });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 5. RESET ROUND (Admin only)
        // ----------------------------------------------------
        socket.on('reset_round', (data, callback) => {
            try {
                const { roomId, adminToken } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                const result = roomManager.resetRound(normalizedRoomId, adminToken);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('round_reset', {
                        room: result.room,
                        round: result.room.currentRound,
                    });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 5b. RESET BUZZER (Admin only, same round)
        // ----------------------------------------------------
        socket.on('reset_buzzer', (data, callback) => {
            try {
                const { roomId, adminToken } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                const result = roomManager.resetBuzzer(normalizedRoomId, adminToken);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('buzzer_reset', {
                        room: result.room,
                        round: result.room.currentRound,
                    });
                    io.to(normalizedRoomId).emit('buzz_queue_updated', {
                        round: result.room.currentRound,
                        buzzQueue: [],
                        room: result.room,
                    });
                    io.to(normalizedRoomId).emit('room_updated', {
                        room: result.room,
                    });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 5c. LOCK ROUND (Admin only)
        // ----------------------------------------------------
        socket.on('lock_round', (data, callback) => {
            try {
                const { roomId, adminToken } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                const result = roomManager.lockRound(normalizedRoomId, adminToken);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('round_locked', {
                        room: result.room,
                        round: result.room.currentRound,
                        buzzQueue: result.room.buzzQueue,
                    });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 6. END ROOM (Admin only)
        // ----------------------------------------------------
        socket.on('end_room', (data, callback) => {
            try {
                const { roomId, adminToken } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase();
                const result = roomManager.endRoom(normalizedRoomId, adminToken);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('room_ended', {
                        message: 'Room has ended by the host.',
                    });
                    io.to(normalizedRoomId).emit('buzz_queue_updated', {
                        round: 1,
                        buzzQueue: [],
                    });
                    if (normalizedRoomId !== room_manager_1.RoomManager.DEFAULT_ROOM_ID) {
                        io.in(normalizedRoomId).socketsLeave(normalizedRoomId);
                    }
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 6b. KICK PARTICIPANT (Admin only)
        // ----------------------------------------------------
        socket.on('kick_participant', (data, callback) => {
            try {
                const { roomId, adminToken, participantId } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase() || room_manager_1.RoomManager.DEFAULT_ROOM_ID;
                const result = roomManager.kickParticipant(normalizedRoomId, adminToken, participantId);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('room_updated', {
                        room: result.room,
                        event: 'participant_kicked',
                        participantId,
                    });
                    io.to(normalizedRoomId).emit('buzz_queue_updated', {
                        round: result.room.currentRound,
                        buzzQueue: result.room.buzzQueue,
                        room: result.room,
                    });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 6c. CLEAR ALL PARTICIPANTS (Admin only)
        // ----------------------------------------------------
        socket.on('clear_all_participants', (data, callback) => {
            try {
                const { roomId, adminToken } = data || {};
                const normalizedRoomId = (roomId || '').toString().trim().toUpperCase() || room_manager_1.RoomManager.DEFAULT_ROOM_ID;
                const result = roomManager.clearAllParticipants(normalizedRoomId, adminToken);
                if (typeof callback === 'function') {
                    callback(result);
                }
                if (result.success) {
                    io.to(normalizedRoomId).emit('room_updated', {
                        room: result.room,
                        event: 'all_participants_cleared',
                    });
                    io.to(normalizedRoomId).emit('buzz_queue_updated', {
                        round: result.room.currentRound,
                        buzzQueue: [],
                        room: result.room,
                    });
                    io.to(normalizedRoomId).emit('buzzer_reset', {
                        room: result.room,
                        round: result.room.currentRound,
                    });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 7. ATOMIC BUZZ (Participant - Ultra Lowest Latency Critical Path)
        // ----------------------------------------------------
        socket.on('buzz', (data, callback) => {
            try {
                const { roomId, participantId, round } = data || {};
                const session = roomManager.getSocketSession(socket.id);
                const resolvedParticipantId = participantId || session?.participantId;
                const targetRoomId = (roomId && roomId.toString().trim().length > 0)
                    ? roomId.toString().trim().toUpperCase()
                    : (session?.roomId || room_manager_1.RoomManager.DEFAULT_ROOM_ID);
                const room = roomManager.getRoom(targetRoomId);
                if (!room) {
                    if (typeof callback === 'function') {
                        callback({ status: 'ERROR', message: 'Room not found or has ended.' });
                    }
                    return;
                }
                if (!resolvedParticipantId) {
                    if (typeof callback === 'function') {
                        callback({ status: 'ERROR', message: 'Participant not recognized in room.' });
                    }
                    return;
                }
                // Execute atomic check-and-commit in server's synchronous turn (O(1), zero DB, zero async delay)
                const result = buzzer_engine_1.BuzzerEngine.processBuzz(room, resolvedParticipantId, round);
                // Immediate callback to sender with zero intermediary processing
                if (typeof callback === 'function') {
                    callback(result);
                }
                // If this buzz successfully committed to the queue, broadcast immediately
                if (result.status === 'SUCCESS') {
                    const sanitized = roomManager.sanitizeRoom(room);
                    // 1. Single authoritative broadcast to all participants in the room
                    io.to(room.roomId).emit('buzz_queue_updated', {
                        round: result.round,
                        buzzQueue: result.buzzQueue,
                        newEntry: result.entry,
                        room: sanitized,
                    });
                    // 2. Winner broadcast if rank 1
                    if (result.rank === 1) {
                        io.to(room.roomId).emit('winner_declared', {
                            winner: {
                                participantId: result.participantId,
                                name: result.name,
                                round: result.round,
                                serverTimestamp: result.serverTimestamp,
                            },
                            room: sanitized,
                        });
                    }
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ status: 'ERROR', message: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 8b. REAL-TIME LATENCY PING (Instant health & delay measurement)
        // ----------------------------------------------------
        socket.on('latency_ping', (clientTimestamp, callback) => {
            const serverTime = Date.now();
            if (typeof callback === 'function') {
                callback({ serverTime, clientTimestamp });
            }
            else {
                socket.emit('latency_pong', { serverTime, clientTimestamp });
            }
        });
        // ----------------------------------------------------
        // 9. PINPOINT QUESTION SYNC (Admin & View Portal)
        // ----------------------------------------------------
        socket.on('get_questions', (_, callback) => {
            const payload = {
                questions: exports.sharedQuestions,
                settings: exports.sharedGameSettings,
                activeIndex: exports.activeQuestionIndex,
                isAnswerRevealed: exports.isAnswerRevealed,
                revealedClueCount: exports.revealedClueCount,
            };
            if (typeof callback === 'function') {
                callback({ success: true, ...payload });
            }
            else {
                socket.emit('questions_updated', payload);
            }
        });
        socket.on('update_questions', (data, callback) => {
            try {
                if (data && Array.isArray(data.questions)) {
                    exports.sharedQuestions = data.questions;
                }
                if (data && data.settings) {
                    exports.sharedGameSettings = { ...exports.sharedGameSettings, ...data.settings };
                }
                io.emit('questions_updated', {
                    questions: exports.sharedQuestions,
                    settings: exports.sharedGameSettings,
                    activeIndex: exports.activeQuestionIndex,
                    isAnswerRevealed: exports.isAnswerRevealed,
                    revealedClueCount: exports.revealedClueCount,
                });
                if (typeof callback === 'function') {
                    callback({ success: true, questions: exports.sharedQuestions, settings: exports.sharedGameSettings });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        socket.on('set_active_question', (data, callback) => {
            try {
                const index = typeof data?.index === 'number' ? data.index : 0;
                exports.activeQuestionIndex = index;
                exports.isAnswerRevealed = false;
                exports.revealedClueCount = 1; // Reset to Clue 1 on new challenge
                io.emit('active_question_changed', {
                    index: exports.activeQuestionIndex,
                    revealedClueCount: exports.revealedClueCount,
                    isAnswerRevealed: exports.isAnswerRevealed,
                });
                io.emit('clue_count_changed', { count: exports.revealedClueCount });
                io.emit('answer_revealed', { isRevealed: false });
                if (typeof callback === 'function') {
                    callback({ success: true, index: exports.activeQuestionIndex, revealedClueCount: exports.revealedClueCount });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        socket.on('set_clue_count', (data, callback) => {
            try {
                const count = typeof data?.count === 'number' ? Math.max(1, Math.min(4, data.count)) : 1;
                exports.revealedClueCount = count;
                io.emit('clue_count_changed', { count: exports.revealedClueCount });
                if (typeof callback === 'function') {
                    callback({ success: true, count: exports.revealedClueCount });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        socket.on('reveal_next_clue', (_, callback) => {
            try {
                const currentQ = exports.sharedQuestions && exports.sharedQuestions[exports.activeQuestionIndex];
                const maxClues = (currentQ?.clues && currentQ.clues.length > 0) ? currentQ.clues.length : 4;
                if (exports.revealedClueCount < maxClues) {
                    exports.revealedClueCount++;
                }
                io.emit('clue_count_changed', { count: exports.revealedClueCount });
                if (typeof callback === 'function') {
                    callback({ success: true, count: exports.revealedClueCount });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        socket.on('reset_clues', (_, callback) => {
            try {
                exports.revealedClueCount = 1;
                exports.isAnswerRevealed = false;
                io.emit('clue_count_changed', { count: exports.revealedClueCount });
                io.emit('answer_revealed', { isRevealed: false });
                if (typeof callback === 'function') {
                    callback({ success: true, count: exports.revealedClueCount });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        socket.on('reveal_answer', (data, callback) => {
            try {
                exports.isAnswerRevealed = Boolean(data?.isRevealed);
                io.emit('answer_revealed', { isRevealed: exports.isAnswerRevealed });
                if (typeof callback === 'function') {
                    callback({ success: true, isRevealed: exports.isAnswerRevealed });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        socket.on('update_team_scores', (data, callback) => {
            try {
                io.emit('team_scores_updated', { teamScores: data?.teamScores || {} });
                if (typeof callback === 'function') {
                    callback({ success: true });
                }
            }
            catch (err) {
                if (typeof callback === 'function') {
                    callback({ success: false, error: err.message });
                }
            }
        });
        // ----------------------------------------------------
        // 10. DISCONNECT HANDLING
        // ----------------------------------------------------
        socket.on('disconnect', () => {
            const discoInfo = roomManager.handleDisconnect(socket.id);
            if (!discoInfo)
                return;
            if (discoInfo.type === 'ADMIN_DISCONNECTED') {
                io.to(discoInfo.roomId).emit('host_disconnected', {
                    message: 'Host disconnected. Waiting for reconnection...',
                    room: discoInfo.room,
                });
            }
            else if (discoInfo.type === 'PARTICIPANT_DISCONNECTED') {
                broadcastRoomThrottled(io, roomManager, discoInfo.roomId);
            }
        });
    });
}
