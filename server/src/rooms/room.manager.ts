import crypto from 'crypto';
import {
  Room,
  Participant,
  SanitizedRoom,
  SanitizedParticipant,
} from './room.types';
import { generateRoomId } from '../utils/room-id.generator';

export class RoomManager {
  public static readonly DEFAULT_ROOM_ID = 'PINPOINT';

  private rooms: Map<string, Room> = new Map();
  private socketMap: Map<
    string,
    { roomId: string; participantId?: string; isAdmin: boolean }
  > = new Map();

  constructor() {
    this.initDefaultRoom();
  }

  /**
   * Initializes the permanent default arena room (PINPOINT).
   */
  private initDefaultRoom(): Room {
    const roomId = RoomManager.DEFAULT_ROOM_ID;
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        adminId: 'pinpoint-admin-id',
        adminToken: 'pinpoint-permanent-admin-token',
        adminSocketId: '',
        adminConnected: false,
        participants: new Map<string, Participant>(),
        currentRound: 1,
        roundStatus: 'WAITING',
        currentWinner: null,
        winnerName: null,
        winnerServerTimestamp: null,
        buzzQueue: [],
        roundHistory: [],
        createdAt: new Date().toISOString(),
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  /**
   * Binds an admin socket to the permanent default room.
   */
  public bindAdminToDefaultRoom(adminSocketId: string): {
    roomId: string;
    adminToken: string;
    adminId: string;
    room: SanitizedRoom;
  } {
    const room = this.initDefaultRoom();
    room.adminSocketId = adminSocketId;
    room.adminConnected = true;
    if (room.adminDisconnectTimeout) {
      clearTimeout(room.adminDisconnectTimeout);
      room.adminDisconnectTimeout = undefined;
    }

    this.socketMap.set(adminSocketId, {
      roomId: room.roomId,
      isAdmin: true,
    });

    return {
      roomId: room.roomId,
      adminToken: room.adminToken,
      adminId: room.adminId,
      room: this.sanitizeRoom(room),
    };
  }

  /**
   * Creates a new game room with an admin host (or rebinds default).
   */
  public createRoom(adminSocketId: string): {
    roomId: string;
    adminToken: string;
    adminId: string;
    room: SanitizedRoom;
  } {
    return this.bindAdminToDefaultRoom(adminSocketId);
  }

  /**
   * Retrieves an active room.
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  /**
   * Checks whether a room exists and is active.
   */
  public isRoomActive(roomId: string): boolean {
    return this.rooms.has(roomId.toUpperCase());
  }

  /**
   * Adds or reconnects a participant in a room.
   */
  public joinRoom(
    roomId: string | undefined | null,
    rawName: string,
    socketId: string,
    reconnectParticipantId?: string
  ):
    | { success: true; room: SanitizedRoom; participant: SanitizedParticipant; isReconnect: boolean }
    | { success: false; error: string } {
    const targetRoomId = (roomId && roomId.trim().length > 0 && roomId.toUpperCase() !== 'DEFAULT')
      ? roomId.trim().toUpperCase()
      : RoomManager.DEFAULT_ROOM_ID;

    let room = this.getRoom(targetRoomId);
    if (!room && targetRoomId === RoomManager.DEFAULT_ROOM_ID) {
      room = this.initDefaultRoom();
    }
    if (!room) {
      return { success: false, error: 'Room does not exist or has ended.' };
    }

    const trimmedName = rawName.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      return { success: false, error: 'Name must be between 1 and 50 characters.' };
    }

    // Handle participant reconnection by ID
    if (reconnectParticipantId && room.participants.has(reconnectParticipantId)) {
      const existing = room.participants.get(reconnectParticipantId)!;
      if (existing.disconnectTimeout) {
        clearTimeout(existing.disconnectTimeout);
        existing.disconnectTimeout = undefined;
      }
      existing.socketId = socketId;
      existing.isConnected = true;
      this.socketMap.set(socketId, {
        roomId: room.roomId,
        participantId: existing.participantId,
        isAdmin: false,
      });

      return {
        success: true,
        room: this.sanitizeRoom(room),
        participant: this.sanitizeParticipant(existing),
        isReconnect: true,
      };
    }

    // Handle participant RE-JOIN by Name (e.g. if User A accidentally leaves and rejoins)
    for (const existing of room.participants.values()) {
      if (existing.name.toLowerCase() === trimmedName.toLowerCase()) {
        // Automatically reclaim and reconnect the existing participant spot
        if (existing.disconnectTimeout) {
          clearTimeout(existing.disconnectTimeout);
          existing.disconnectTimeout = undefined;
        }
        existing.socketId = socketId;
        existing.isConnected = true;
        this.socketMap.set(socketId, {
          roomId: room.roomId,
          participantId: existing.participantId,
          isAdmin: false,
        });

        return {
          success: true,
          room: this.sanitizeRoom(room),
          participant: this.sanitizeParticipant(existing),
          isReconnect: true,
        };
      }
    }

    // New participant join
    const participantId = crypto.randomUUID();
    const participant: Participant = {
      participantId,
      name: trimmedName,
      socketId,
      joinedAt: new Date().toISOString(),
      isConnected: true,
      hasBuzzed: false,
    };

    room.participants.set(participantId, participant);
    this.socketMap.set(socketId, {
      roomId: room.roomId,
      participantId,
      isAdmin: false,
    });

    return {
      success: true,
      room: this.sanitizeRoom(room),
      participant: this.sanitizeParticipant(participant),
      isReconnect: false,
    };
  }

  /**
   * Starts a round (Admin only).
   */
  public startRound(
    roomId: string,
    adminToken: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }
    if (room.adminToken !== adminToken) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    room.roundStatus = 'ACTIVE';
    room.currentWinner = null;
    room.winnerName = null;
    room.winnerServerTimestamp = null;
    room.buzzQueue = [];
    room.firstBuzzEpochMs = undefined;

    // Reset buzz status for all participants
    for (const participant of room.participants.values()) {
      participant.hasBuzzed = false;
    }

    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Resets and starts the next round (Admin only).
   */
  public resetRound(
    roomId: string,
    adminToken: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }
    if (room.adminToken !== adminToken) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    // Archive current round buzzes to history if any buzzes occurred
    if (room.buzzQueue && room.buzzQueue.length > 0) {
      const top = room.buzzQueue[0];
      room.roundHistory.push({
        round: room.currentRound,
        winner: top.name,
        participantId: top.participantId,
        serverTimestamp: top.serverTimestamp,
        buzzes: [...room.buzzQueue],
      });
    }

    room.currentRound += 1;
    room.roundStatus = 'ACTIVE';
    room.currentWinner = null;
    room.winnerName = null;
    room.winnerServerTimestamp = null;
    room.buzzQueue = [];
    room.firstBuzzEpochMs = undefined;

    for (const participant of room.participants.values()) {
      participant.hasBuzzed = false;
    }

    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Resets the buzzer for the current round without incrementing round (Admin only).
   */
  public resetBuzzer(
    roomId: string,
    adminToken: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }
    if (room.adminToken !== adminToken) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    room.roundStatus = 'ACTIVE';
    room.currentWinner = null;
    room.winnerName = null;
    room.winnerServerTimestamp = null;
    room.buzzQueue = [];
    room.firstBuzzEpochMs = undefined;

    for (const participant of room.participants.values()) {
      participant.hasBuzzed = false;
    }

    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Kicks a participant from the room and removes their buzz entries (Admin only).
   */
  public kickParticipant(
    roomId: string,
    adminToken: string,
    participantId: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, error: 'Room not found.' };
    if (room.adminToken !== adminToken) return { success: false, error: 'UNAUTHORIZED' };

    const participant = room.participants.get(participantId);
    if (participant) {
      if (participant.disconnectTimeout) {
        clearTimeout(participant.disconnectTimeout);
      }
      room.participants.delete(participantId);
      if (participant.socketId) {
        this.socketMap.delete(participant.socketId);
      }
    }

    // Remove from buzzQueue and re-rank remaining
    if (room.buzzQueue && room.buzzQueue.length > 0) {
      room.buzzQueue = room.buzzQueue.filter((b) => b.participantId !== participantId);
      room.buzzQueue.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });
      if (room.currentWinner === participantId) {
        if (room.buzzQueue.length > 0) {
          room.currentWinner = room.buzzQueue[0].participantId;
          room.winnerName = room.buzzQueue[0].name;
          room.winnerServerTimestamp = room.buzzQueue[0].serverTimestamp;
        } else {
          room.currentWinner = null;
          room.winnerName = null;
          room.winnerServerTimestamp = null;
          room.firstBuzzEpochMs = undefined;
        }
      }
    }

    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Clears all participants and all buzz entries from the room (Admin only).
   */
  public clearAllParticipants(
    roomId: string,
    adminToken: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, error: 'Room not found.' };
    if (room.adminToken !== adminToken) return { success: false, error: 'UNAUTHORIZED' };

    for (const p of room.participants.values()) {
      if (p.disconnectTimeout) clearTimeout(p.disconnectTimeout);
      if (p.socketId) this.socketMap.delete(p.socketId);
    }

    room.participants.clear();
    room.buzzQueue = [];
    room.currentWinner = null;
    room.winnerName = null;
    room.winnerServerTimestamp = null;
    room.firstBuzzEpochMs = undefined;

    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Locks the buzzer for the current round (Admin only).
   */
  public lockRound(
    roomId: string,
    adminToken: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }
    if (room.adminToken !== adminToken) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    room.roundStatus = 'LOCKED';
    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Ends and destroys the room session (Admin only).
   */
  public endRoom(
    roomId: string,
    adminToken: string
  ): { success: true } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }
    if (room.adminToken !== adminToken) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    if (room.adminDisconnectTimeout) {
      clearTimeout(room.adminDisconnectTimeout);
    }
    for (const p of room.participants.values()) {
      if (p.disconnectTimeout) {
        clearTimeout(p.disconnectTimeout);
      }
    }

    if (room.roomId === RoomManager.DEFAULT_ROOM_ID) {
      // Default arena room is permanent; reset session instead of deleting
      room.currentRound = 1;
      room.roundStatus = 'WAITING';
      room.currentWinner = null;
      room.winnerName = null;
      room.winnerServerTimestamp = null;
      room.buzzQueue = [];
      room.roundHistory = [];
      room.participants.clear();
      return { success: true };
    }

    this.rooms.delete(room.roomId);
    return { success: true };
  }

  /**
   * Reconnects an admin with an existing token.
   */
  public reconnectAdmin(
    roomId: string,
    adminToken: string,
    newSocketId: string
  ): { success: true; room: SanitizedRoom } | { success: false; error: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room does not exist or has ended.' };
    }
    if (room.adminToken !== adminToken) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    if (room.adminDisconnectTimeout) {
      clearTimeout(room.adminDisconnectTimeout);
      room.adminDisconnectTimeout = undefined;
    }

    room.adminConnected = true;
    room.adminSocketId = newSocketId;
    this.socketMap.set(newSocketId, { roomId: room.roomId, isAdmin: true });

    return { success: true, room: this.sanitizeRoom(room) };
  }

  /**
   * Handles socket disconnection gracefully.
   */
  public handleDisconnect(socketId: string):
    | {
        type: 'ADMIN_DISCONNECTED';
        roomId: string;
        room: SanitizedRoom;
      }
    | {
        type: 'PARTICIPANT_DISCONNECTED';
        roomId: string;
        participantId: string;
        participantName: string;
        room: SanitizedRoom;
      }
    | null {
    const session = this.socketMap.get(socketId);
    this.socketMap.delete(socketId);
    if (!session) return null;

    const room = this.rooms.get(session.roomId);
    if (!room) return null;

    if (session.isAdmin) {
      room.adminConnected = false;
      // Do not delete permanent default room on admin disconnect
      if (room.roomId !== RoomManager.DEFAULT_ROOM_ID) {
        room.adminDisconnectTimeout = setTimeout(() => {
          if (!room.adminConnected) {
            this.rooms.delete(room.roomId);
          }
        }, 60000);
      }

      return {
        type: 'ADMIN_DISCONNECTED',
        roomId: room.roomId,
        room: this.sanitizeRoom(room),
      };
    } else if (session.participantId) {
      const participant = room.participants.get(session.participantId);
      if (participant) {
        participant.isConnected = false;
        // 60-second grace period before participant cleanup
        participant.disconnectTimeout = setTimeout(() => {
          if (!participant.isConnected) {
            room.participants.delete(participant.participantId);
          }
        }, 60000);

        return {
          type: 'PARTICIPANT_DISCONNECTED',
          roomId: room.roomId,
          participantId: participant.participantId,
          participantName: participant.name,
          room: this.sanitizeRoom(room),
        };
      }
    }

    return null;
  }

  /**
   * Gets socket mapping information
   */
  public getSocketSession(socketId: string) {
    return this.socketMap.get(socketId);
  }

  /**
   * Sanitizes participant object for network transmission
   */
  public sanitizeParticipant(participant: Participant): SanitizedParticipant {
    return {
      participantId: participant.participantId,
      name: participant.name,
      isConnected: participant.isConnected,
      hasBuzzed: participant.hasBuzzed,
      joinedAt: participant.joinedAt,
    };
  }

  /**
   * Sanitizes room object for network transmission (omits adminToken)
   */
  public sanitizeRoom(room: Room): SanitizedRoom {
    return {
      roomId: room.roomId,
      adminConnected: room.adminConnected,
      participants: Array.from(room.participants.values()).map((p) =>
        this.sanitizeParticipant(p)
      ),
      currentRound: room.currentRound,
      roundStatus: room.roundStatus,
      currentWinner: room.currentWinner,
      winnerName: room.winnerName,
      winnerServerTimestamp: room.winnerServerTimestamp,
      buzzQueue: room.buzzQueue || [],
      roundHistory: room.roundHistory,
      createdAt: room.createdAt,
    };
  }
}
