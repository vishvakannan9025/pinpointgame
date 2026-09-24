"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealedClueCount = exports.isAnswerRevealed = exports.activeQuestionIndex = exports.sharedGameSettings = exports.sharedQuestions = void 0;
exports.registerSocketHandlers = registerSocketHandlers;
const room_manager_1 = require("../rooms/room.manager");
const buzzer_engine_1 = require("../buzzer/buzzer.engine");
exports.sharedQuestions = [];
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
                if (exports.revealedClueCount < 4) {
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
