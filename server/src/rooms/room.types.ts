/**
 * Possible states for a round within a room
 */
export type RoundStatus = 'WAITING' | 'ACTIVE' | 'LOCKED';

/**
 * Ordered buzz entry representing a participant's buzz in the current round
 */
export interface BuzzEntry {
  rank: number;
  participantId: string;
  name: string;
  serverTimestamp: string;
  timeOffsetMs: number;
}

/**
 * Historical record of a completed round
 */
export interface RoundRecord {
  round: number;
  winner: string;
  participantId: string;
  serverTimestamp: string;
  buzzes?: BuzzEntry[];
}

/**
 * Connected or reconnecting participant
 */
export interface Participant {
  participantId: string;
  name: string;
  socketId: string;
  joinedAt: string;
  isConnected: boolean;
  hasBuzzed: boolean;
  disconnectTimeout?: NodeJS.Timeout;
}

/**
 * Active room instance stored in server memory
 */
export interface Room {
  roomId: string;
  adminId: string;
  adminToken: string;
  adminSocketId: string;
  adminConnected: boolean;
  participants: Map<string, Participant>;
  currentRound: number;
  roundStatus: RoundStatus;
  currentWinner: string | null;
  winnerName: string | null;
  winnerServerTimestamp: string | null;
  buzzQueue: BuzzEntry[];
  firstBuzzEpochMs?: number;
  roundHistory: RoundRecord[];
  createdAt: string;
  adminDisconnectTimeout?: NodeJS.Timeout;
}

/**
 * Sanitized participant representation sent over the wire
 */
export interface SanitizedParticipant {
  participantId: string;
  name: string;
  isConnected: boolean;
  hasBuzzed: boolean;
  joinedAt: string;
}

/**
 * Sanitized room representation safe to broadcast to clients (no adminToken)
 */
export interface SanitizedRoom {
  roomId: string;
  adminConnected: boolean;
  participants: SanitizedParticipant[];
  currentRound: number;
  roundStatus: RoundStatus;
  currentWinner: string | null;
  winnerName: string | null;
  winnerServerTimestamp: string | null;
  buzzQueue: BuzzEntry[];
  roundHistory: RoundRecord[];
  createdAt: string;
}

/**
 * Result returned by the atomic Buzzer Engine
 */
export type BuzzerResult =
  | {
      status: 'SUCCESS';
      entry: BuzzEntry;
      rank: number;
      participantId: string;
      name: string;
      round: number;
      serverTimestamp: string;
      timeOffsetMs: number;
      buzzQueue: BuzzEntry[];
    }
  | {
      status: 'TOO_LATE';
      round: number;
      message?: string;
    }
  | {
      status: 'ERROR';
      message: string;
    };
