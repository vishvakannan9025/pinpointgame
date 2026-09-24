"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuzzerEngine = void 0;
/**
 * Buzzer Engine
 *
 * OFFICIAL SPECIFICATION:
 * All buzzer presses are recorded in exact order committed by the server's atomic operation.
 * The first participant receives Rank 1 (offset 0ms), followed by Rank 2, Rank 3, etc.
 * with precise millisecond/fraction-of-second offsets.
 *
 * The engine never relies on client timestamps or local device clocks.
 * All decisions are made synchronously and atomically on the server.
 */
class BuzzerEngine {
    /**
     * Processes a buzzer request atomically.
     *
     * @param room The active room
     * @param participantId ID of the participant attempting to buzz
     * @param requestedRound The round number the participant thinks is active
     * @returns BuzzerResult indicating SUCCESS (with rank and offset), TOO_LATE, or ERROR
     */
    static processBuzz(room, participantId, requestedRound) {
        // 1. FAST CHECK: Verify round is currently active
        if (room.roundStatus !== 'ACTIVE') {
            return {
                status: 'TOO_LATE',
                round: room.currentRound,
                message: 'Buzzer is currently locked or waiting for coordinator.',
            };
        }
        // 2. Verify participant exists in the room
        const participant = room.participants.get(participantId);
        if (!participant) {
            return {
                status: 'ERROR',
                message: 'Participant does not belong to this room.',
            };
        }
        // 3. Verify participant has not already buzzed in this round
        if (participant.hasBuzzed) {
            return {
                status: 'TOO_LATE',
                round: room.currentRound,
                message: 'You have already buzzed for this round.',
            };
        }
        // 4. Verify requested round matches current room round
        if (requestedRound !== undefined && requestedRound !== room.currentRound) {
            return {
                status: 'ERROR',
                message: `Buzzer submitted for round ${requestedRound}, but current round is ${room.currentRound}.`,
            };
        }
        // 6. ATOMIC COMMIT TO BUZZ QUEUE
        if (!room.buzzQueue) {
            room.buzzQueue = [];
        }
        const now = Date.now();
        let timeOffsetMs = 0;
        const rank = room.buzzQueue.length + 1;
        if (room.buzzQueue.length === 0) {
            room.firstBuzzEpochMs = now;
            timeOffsetMs = 0;
        }
        else {
            timeOffsetMs = Math.max(0, now - (room.firstBuzzEpochMs ?? now));
        }
        const serverTimestamp = new Date().toISOString();
        const entry = {
            rank,
            participantId: participant.participantId,
            name: participant.name,
            serverTimestamp,
            timeOffsetMs,
        };
        room.buzzQueue.push(entry);
        participant.hasBuzzed = true;
        // Set first buzzer as currentWinner for compatibility
        if (rank === 1) {
            room.currentWinner = participantId;
            room.winnerName = participant.name;
            room.winnerServerTimestamp = serverTimestamp;
        }
        return {
            status: 'SUCCESS',
            entry,
            rank,
            participantId: participant.participantId,
            name: participant.name,
            round: room.currentRound,
            serverTimestamp,
            timeOffsetMs,
            buzzQueue: room.buzzQueue,
        };
    }
}
exports.BuzzerEngine = BuzzerEngine;
