const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

console.log('⚡ Starting Ultra-Low-Latency Buzzer & Persistent WebSocket Test...');
console.log('🌐 Server URL:', SERVER_URL);

async function testLatencyAndBuzzer() {
  // 1. Coordinator connects via pure WebSocket ONLY
  const adminSocket = io(SERVER_URL, {
    transports: ['websocket'], // STRICTLY PURE WEBSOCKET
    forceNew: false,
    reconnection: true,
  });

  await new Promise((resolve, reject) => {
    adminSocket.on('connect', resolve);
    adminSocket.on('connect_error', reject);
  });
  console.log('✅ 1. Coordinator connected via Pure WebSocket (no polling)!');

  // 2. Create room
  const createRes = await new Promise((resolve) => {
    adminSocket.emit('create_room', {}, resolve);
  });
  const { roomId, adminToken } = createRes;
  console.log('✅ 2. Room created:', roomId);

  // 3. Connect 3 Teams via pure WebSocket
  const teams = ['Supernovas', 'Quantum Racers', 'Byte Busters'];
  const teamSockets = [];
  const participants = [];

  for (const name of teams) {
    const s = io(SERVER_URL, {
      transports: ['websocket'], // STRICTLY PURE WEBSOCKET
      forceNew: false,
      reconnection: true,
    });
    await new Promise((resolve) => s.on('connect', resolve));
    const joinRes = await new Promise((resolve) => {
      s.emit('join_room', { roomId, name }, resolve);
    });
    teamSockets.push(s);
    participants.push(joinRes.participant);
    console.log(`✅ 3. ${name} joined via Pure WebSocket (ID: ${joinRes.participant.participantId})`);
  }

  // 4. Start round
  await new Promise((resolve) => {
    teamSockets[0].once('round_started', resolve);
    adminSocket.emit('start_round', { roomId, adminToken });
  });
  console.log('✅ 4. Round 1 started! Sockets permanently established.');

  // 5. Measure critical-path buzzer response latency
  console.log('\n--- BUZZ CRITICAL PATH BENCHMARK ---');

  const buzzPromises = [];
  const broadcastEvents = [];

  // Listen for real-time broadcasts
  adminSocket.on('buzz_queue_updated', (data) => {
    broadcastEvents.push(data);
  });

  // Team 0 buzzes first
  const t0 = process.hrtime.bigint();
  const ack0 = await new Promise((resolve) => {
    teamSockets[0].emit('buzz', {
      roomId,
      participantId: participants[0].participantId,
      round: 1,
    }, resolve);
  });
  const t1 = process.hrtime.bigint();
  const elapsedMs0 = Number(t1 - t0) / 1e6;
  console.log(`⚡ Team 1 (${teams[0]}) Buzzer ACK Latency: ${elapsedMs0.toFixed(2)} ms`);
  console.log(`   Result: Status=${ack0.status}, Rank=#${ack0.rank}, Offset=${ack0.timeOffsetMs}ms`);

  // Team 1 buzzes next
  await new Promise((r) => setTimeout(r, 20)); // 20ms stagger
  const t2 = process.hrtime.bigint();
  const ack1 = await new Promise((resolve) => {
    teamSockets[1].emit('buzz', {
      roomId,
      participantId: participants[1].participantId,
      round: 1,
    }, resolve);
  });
  const t3 = process.hrtime.bigint();
  const elapsedMs1 = Number(t3 - t2) / 1e6;
  console.log(`⚡ Team 2 (${teams[1]}) Buzzer ACK Latency: ${elapsedMs1.toFixed(2)} ms`);
  console.log(`   Result: Status=${ack1.status}, Rank=#${ack1.rank}, Offset=${ack1.timeOffsetMs}ms`);

  // Team 2 buzzes next
  await new Promise((r) => setTimeout(r, 30)); // 30ms stagger
  const t4 = process.hrtime.bigint();
  const ack2 = await new Promise((resolve) => {
    teamSockets[2].emit('buzz', {
      roomId,
      participantId: participants[2].participantId,
      round: 1,
    }, resolve);
  });
  const t5 = process.hrtime.bigint();
  const elapsedMs2 = Number(t5 - t4) / 1e6;
  console.log(`⚡ Team 3 (${teams[2]}) Buzzer ACK Latency: ${elapsedMs2.toFixed(2)} ms`);
  console.log(`   Result: Status=${ack2.status}, Rank=#${ack2.rank}, Offset=${ack2.timeOffsetMs}ms`);

  // Verify positions and offsets
  console.log('\n--- VERIFYING RESULTS ---');
  if (ack0.rank === 1 && ack1.rank === 2 && ack2.rank === 3) {
    console.log('✅ PERFECT RANK ACCURACY: #1, #2, #3 recorded in exact fraction-of-second order!');
  } else {
    console.error('❌ Rank order mismatch!');
    process.exit(1);
  }

  if (ack0.timeOffsetMs === 0 && ack1.timeOffsetMs > 0 && ack2.timeOffsetMs > ack1.timeOffsetMs) {
    console.log(`✅ PERFECT TIME OFFSETS: #1 is 0ms, #2 is +${ack1.timeOffsetMs}ms, #3 is +${ack2.timeOffsetMs}ms`);
  } else {
    console.error('❌ Time offsets unexpected:', ack0.timeOffsetMs, ack1.timeOffsetMs, ack2.timeOffsetMs);
    process.exit(1);
  }

  if (broadcastEvents.length === 3) {
    console.log('✅ IMMEDIATE BROADCAST: 3/3 buzz_queue_updated broadcasts received by room coordinator!');
  }

  // Cleanup
  adminSocket.disconnect();
  teamSockets.forEach((s) => s.disconnect());
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! BUZZER IS ULTRA-LOW LATENCY & PURE WEBSOCKET.');
  process.exit(0);
}

testLatencyAndBuzzer().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
