"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomId = generateRoomId;
const crypto_1 = __importDefault(require("crypto"));
// Characters excluding ambiguous ones: I, O, 0, 1
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/**
 * Generates a unique 6-character room code that avoids visual confusion.
 * E.g., 'AB12CD', 'K9MN4P'
 *
 * @param existingRoomIds Set or array of active room IDs to avoid collisions
 * @returns A unique 6-character uppercase string
 */
function generateRoomId(isRoomActive) {
    const maxAttempts = 1000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let roomId = '';
        const bytes = crypto_1.default.randomBytes(6);
        for (let i = 0; i < 6; i++) {
            roomId += CHARSET[bytes[i] % CHARSET.length];
        }
        if (!isRoomActive(roomId)) {
            return roomId;
        }
    }
    // Fallback if space is crowded (extremely rare with 32^6 = 1 billion possibilities)
    const timestampSuffix = Date.now().toString(36).slice(-3).toUpperCase();
    const randomPrefix = CHARSET[Math.floor(Math.random() * CHARSET.length)] +
        CHARSET[Math.floor(Math.random() * CHARSET.length)] +
        CHARSET[Math.floor(Math.random() * CHARSET.length)];
    return (randomPrefix + timestampSuffix).slice(0, 6);
}
