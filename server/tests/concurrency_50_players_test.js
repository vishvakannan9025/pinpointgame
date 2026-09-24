const io = require('socket.io-client');

async function test50PlayersConcurrency() {
  const SERVER_URL = 'http://localhost:3000';
  console.log(`========================================================================`);
  console.log(`⚡ STRESS & CONCURRENCY TEST: 50 SIMULTANEOUS PLAYERS IN DEFAULT ARENA`);
  console.log(`========================================================================`);

  // 1. Admin socket connects and binds to PINPOINT
  console.log('1️⃣ Connecting Admin socket...');
  const adminSocket = io(SERVER_URL, { transports: ['websocket'] });

  const adminBindRes = await new Promise((resolve, reject) => {
    adminSocket.on('connect', () => {
      adminSocket.emit('bind_admin', { passcode: 'admin123' }, resolve);
    });
    adminSocket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Admin connection timeout')), 5000);
  });

  console.log(`✅ Admin bound to default arena: "${adminBindRes.roomId}"!`);
  const adminToken = adminBindRes.adminToken;

  // 2. Connect 50 student sockets simultaneously
  const NUM_PLAYERS = 50;
  console.log(`\n2️⃣ Connecting and joining ${NUM_PLAYERS} player sockets concurrently...`);

  const studentSockets = [];
  const joinResults = [];
  const startTime = Date.now();

  const connectAndJoinPromises = Array.from({ length: NUM_PLAYERS }, async (_, i) => {
    const teamName = `College Team ${String(i + 1).padStart(2, '0')}`;
    const s = io(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true,
    });
    studentSockets.push(s);

    await new Promise((resolve, reject) => {
      s.on('connect', resolve);
      s.on('connect_error', reject);
      setTimeout(() => reject(new Error(`Timeout connecting socket ${i + 1}`)), 6000);
    });

    const joinStart = Date.now();
    // Student joins with NO roomId specified!
    const res = await new Promise((resolve) => {
      s.emit('join_room', { name: teamName }, resolve);
    });
    const joinDuration = Date.now() - joinStart;

    joinResults.push({
      index: i + 1,
      teamName,
      success: res && res.success === true,
      roomId: res?.room?.roomId,
      participantId: res?.participant?.participantId,
      durationMs: joinDuration,
    });
  });

  await Promise.all(connectAndJoinPromises);
  const totalJoinTime = Date.now() - startTime;

  console.log(`\n📊 JOIN BURST PERFORMANCE:`);
  console.log(`- Total time to connect & join all ${NUM_PLAYERS} players: ${totalJoinTime}ms`);
  const avgJoinLatency = (joinResults.reduce((acc, r) => acc + r.durationMs, 0) / NUM_PLAYERS).toFixed(1);
  const maxJoinLatency = Math.max(...joinResults.map((r) => r.durationMs));
  const minJoinLatency = Math.min(...joinResults.map((r) => r.durationMs));
  console.log(`- Average Join Ack Latency: ${avgJoinLatency}ms (Min: ${minJoinLatency}ms, Max: ${maxJoinLatency}ms)`);

  const successfulJoins = joinResults.filter((r) => r.success);
  console.log(`- Success Rate: ${successfulJoins.length}/${NUM_PLAYERS} (${(successfulJoins.length / NUM_PLAYERS) * 100}%)`);

  if (successfulJoins.length !== NUM_PLAYERS) {
    throw new Error(`Only ${successfulJoins.length}/${NUM_PLAYERS} players joined successfully!`);
  }

  // Verify all 50 are in the PINPOINT room
  const checkRoomsRes = await fetch(`${SERVER_URL}/api/rooms`).then((r) => r.json());
  const pinpointRoom = checkRoomsRes.rooms.find((r) => r.roomId === 'PINPOINT');
  console.log(`- Verified Server PINPOINT Roster Count: ${pinpointRoom.participantCount} teams!`);

  if (pinpointRoom.participantCount !== NUM_PLAYERS) {
    throw new Error(`Expected 50 participants, found ${pinpointRoom.participantCount}`);
  }

  // 3. Test Host Unlocking Buzzer & 50-Player Simultaneous Buzzer Stampede
  console.log('\n3️⃣ Unlocking Buzzer for Round 1...');
  await new Promise((resolve) => {
    adminSocket.emit('start_round', { roomId: 'PINPOINT', adminToken }, resolve);
  });

  console.log('⚡ SIMULATING 50 CONCURRENT BUZZER HITS...');
  const buzzStartTime = Date.now();
  const buzzPromises = studentSockets.map((s, idx) => {
    return new Promise((resolve) => {
      // Simulate microscopic human variance: 0ms to 40ms jitter
      const jitter = Math.floor(Math.random() * 40);
      setTimeout(() => {
        s.emit('buzz', { roomId: 'PINPOINT' }, resolve);
      }, jitter);
    });
  });

  const buzzResponses = await Promise.all(buzzPromises);
  const totalBuzzTime = Date.now() - buzzStartTime;
  console.log(`- All 50 buzz responses received in: ${totalBuzzTime}ms`);

  const winners = buzzResponses.filter((r) => r && r.status === 'SUCCESS' && r.rank === 1);
  console.log(`- Exact First Winners Declared (Rank 1): ${winners.length} (Expected: exactly 1)`);
  if (winners.length !== 1) {
    throw new Error(`Concurrency race! Found ${winners.length} rank 1 winners instead of 1`);
  }

  const winningParticipant = winners[0];
  console.log(`🏆 RANK 1 WINNER DECLARED: Offset: ${winningParticipant.timeOffsetMs}ms (Instant server lock)`);

  // Cleanup
  console.log('\n4️⃣ Cleaning up test sockets...');
  adminSocket.disconnect();
  studentSockets.forEach((s) => s.disconnect());

  console.log('\n========================================================================');
  console.log('🎉 100% SUCCESS! 50 SIMULTANEOUS PLAYERS HANDLED WITH ZERO ERRORS!');
  console.log('========================================================================');
}

test50PlayersConcurrency().catch((err) => {
  console.error('\n❌ Concurrency Test Failed:', err);
  process.exit(1);
});
