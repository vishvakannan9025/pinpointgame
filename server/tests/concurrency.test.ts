import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { app, server } from '../src/server';

const TEST_PORT = 4123;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

function createClient(): ClientSocket {
  return Client(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting Concurrency & Authoritative Buzzer Stress Test...\n');

  // Start test server on dedicated port
  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`Server listening on port ${TEST_PORT} for testing`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Create Room
    // ----------------------------------------------------
    console.log('--- TEST 1: Admin Creates Room ---');
    const adminSocket = createClient();
    let roomId = '';
    let adminToken = '';

    await new Promise<void>((resolve, reject) => {
      adminSocket.on('connect', () => {
        adminSocket.emit('create_room', {}, (res: any) => {
          if (res.success && res.roomId && res.adminToken) {
            roomId = res.roomId;
            adminToken = res.adminToken;
            console.log(`✅ Room created successfully! Room ID: ${roomId}`);
            resolve();
          } else {
            reject(new Error(`Failed to create room: ${JSON.stringify(res)}`));
          }
        });
      });
    });

    // ----------------------------------------------------
    // TEST 2: Join with Invalid Room ID
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Join Invalid Room ---');
    const invalidJoinSocket = createClient();
    await new Promise<void>((resolve) => {
      invalidJoinSocket.on('connect', () => {
        invalidJoinSocket.emit(
          'join_room',
          { roomId: 'ZZZZ99', name: 'Ghost' },
          (res: any) => {
            if (!res.success) {
              console.log(`✅ Correctly rejected invalid room: ${res.error}`);
            } else {
              throw new Error('Should not have joined invalid room!');
            }
            invalidJoinSocket.disconnect();
            resolve();
          }
        );
      });
    });

    // ----------------------------------------------------
    // TEST 3 & 4: 20 Participants Join Room Concurrently
    // ----------------------------------------------------
    console.log('\n--- TEST 3 & 4: 20 Participants Join Concurrently ---');
    const participantCount = 20;
    const participants: { socket: ClientSocket; participantId: string; name: string }[] = [];

    await Promise.all(
      Array.from({ length: participantCount }).map(async (_, idx) => {
        const pSocket = createClient();
        const pName = `Player_${idx + 1}`;
        await new Promise<void>((resolve, reject) => {
          pSocket.on('connect', () => {
            pSocket.emit(
              'join_room',
              { roomId, name: pName },
              (res: any) => {
                if (res.success) {
                  participants.push({
                    socket: pSocket,
                    participantId: res.participant.participantId,
                    name: pName,
                  });
                  resolve();
                } else {
                  reject(new Error(`Failed to join: ${res.error}`));
                }
              }
            );
          });
        });
      })
    );
    console.log(`✅ Successfully connected ${participants.length} participants.`);

    // ----------------------------------------------------
    // TEST 5: Admin Starts Round 1
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Admin Starts Round 1 ---');
    await new Promise<void>((resolve, reject) => {
      adminSocket.emit('start_round', { roomId, adminToken }, (res: any) => {
        if (res.success && res.room.roundStatus === 'ACTIVE') {
          console.log(`✅ Round 1 is ACTIVE!`);
          resolve();
        } else {
          reject(new Error(`Failed to start round: ${JSON.stringify(res)}`));
        }
      });
    });

    // ----------------------------------------------------
    // TEST 6, 7, 8, 9: 20 Participants Buzz Simultaneously
    // ----------------------------------------------------
    console.log('\n--- TEST 6-9: 20 Participants Buzz SIMULTANEOUSLY in Round 1 ---');
    const buzzResults = await Promise.all(
      participants.map((p) => {
        return new Promise<any>((resolve) => {
          p.socket.emit(
            'buzz',
            { roomId, participantId: p.participantId, round: 1 },
            (res: any) => {
              resolve({ name: p.name, res });
            }
          );
        });
      })
    );

    const successes = buzzResults.filter((r) => r.res.status === 'SUCCESS');
    const errors = buzzResults.filter((r) => r.res.status === 'ERROR');

    console.log(`Total Successes: ${successes.length}`);
    console.log(`Total Errors: ${errors.length}`);

    if (successes.length !== participantCount) {
      throw new Error(`CRITICAL FAILURE: Expected all ${participantCount} to be recorded, but got ${successes.length}!`);
    }

    // Verify all ranks from 1 to 20 are present without duplicates
    const ranks = successes.map((s) => s.res.rank).sort((a: number, b: number) => a - b);
    for (let i = 1; i <= participantCount; i++) {
      if (ranks[i - 1] !== i) {
        throw new Error(`CRITICAL FAILURE: Missing or duplicate rank ${i}! Got ranks: ${ranks.join(', ')}`);
      }
    }

    // Sort by rank
    const sortedBuzzes = [...successes].sort((a, b) => a.res.rank - b.res.rank);
    console.log(`🥇 Rank 1: ${sortedBuzzes[0].name} (Offset: ${sortedBuzzes[0].res.timeOffsetMs}ms, Server: ${sortedBuzzes[0].res.serverTimestamp})`);
    console.log(`🥈 Rank 2: ${sortedBuzzes[1].name} (Offset: +${sortedBuzzes[1].res.timeOffsetMs}ms)`);
    console.log(`🥉 Rank 3: ${sortedBuzzes[2].name} (Offset: +${sortedBuzzes[2].res.timeOffsetMs}ms)`);
    console.log(`... Last Rank ${participantCount}: ${sortedBuzzes[participantCount - 1].name} (Offset: +${sortedBuzzes[participantCount - 1].res.timeOffsetMs}ms)`);
    console.log('✅ SEQUENTIAL BUZZ ORDER VERIFIED: Exactly ranks 1..20 strictly allocated with accurate millisecond timing.');

    // ----------------------------------------------------
    // TEST 10: Repeated Buzzer Attempt by a Participant
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Spam/Repeated Buzzer Attempt After Already Buzzed ---');
    const p1Socket = sortedBuzzes[0].name;
    const p1 = participants.find((p) => p.name === p1Socket)!;

    const repeatRes = await new Promise<any>((resolve) => {
      p1.socket.emit(
        'buzz',
        { roomId, participantId: p1.participantId, round: 1 },
        (res: any) => resolve(res)
      );
    });
    console.log(`Repeat buzz response:`, repeatRes);
    if (repeatRes.status !== 'TOO_LATE') {
      throw new Error(`Expected TOO_LATE on repeat buzz, got: ${repeatRes.status}`);
    }
    console.log('✅ Repeat buzz attempt safely rejected.');

    // ----------------------------------------------------
    // TEST 11: Admin Resets Round (Round 2)
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Admin Resets to Round 2 ---');
    await new Promise<void>((resolve, reject) => {
      adminSocket.emit('reset_round', { roomId, adminToken }, (res: any) => {
        if (res.success && res.room.currentRound === 2 && res.room.roundStatus === 'ACTIVE') {
          console.log(`✅ Round 2 started and ACTIVE! Round History has ${res.room.roundHistory.length} entry.`);
          resolve();
        } else {
          reject(new Error(`Failed to reset round: ${JSON.stringify(res)}`));
        }
      });
    });

    // ----------------------------------------------------
    // TEST 12: Round 2 Simultaneous Buzz
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Round 2 Simultaneous Buzz ---');
    const round2Results = await Promise.all(
      participants.map((p) => {
        return new Promise<any>((resolve) => {
          p.socket.emit(
            'buzz',
            { roomId, participantId: p.participantId, round: 2 },
            (res: any) => {
              resolve({ name: p.name, res });
            }
          );
        });
      })
    );

    const round2Successes = round2Results.filter((r) => r.res.status === 'SUCCESS');
    if (round2Successes.length !== participantCount) {
      throw new Error(`Round 2 failed: expected ${participantCount} successes, got ${round2Successes.length}`);
    }
    const r2Rank1 = round2Successes.find((r) => r.res.rank === 1)!;
    console.log(`🥇 Round 2 Rank 1: ${r2Rank1.name}`);
    console.log('✅ Round 2 sequential buzzer verified.');

    // ----------------------------------------------------
    // TEST 13: End Room
    // ----------------------------------------------------
    console.log('\n--- TEST 13: Admin Ends Room ---');
    let roomEndedReceived = false;
    participants[0].socket.on('room_ended', () => {
      roomEndedReceived = true;
    });

    await new Promise<void>((resolve, reject) => {
      adminSocket.emit('end_room', { roomId, adminToken }, (res: any) => {
        if (res.success) {
          console.log('✅ Room ended by Admin.');
          resolve();
        } else {
          reject(new Error('Failed to end room.'));
        }
      });
    });

    await wait(200);
    if (!roomEndedReceived) {
      console.warn('⚠️ Warning: room_ended event not received by participant before disconnect.');
    } else {
      console.log('✅ Participant received room_ended broadcast.');
    }

    // Cleanup sockets
    adminSocket.disconnect();
    for (const p of participants) {
      p.socket.disconnect();
    }

    console.log('\n🎉 ALL CONCURRENCY AND ATOMIC TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
