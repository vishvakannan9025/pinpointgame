const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

console.log('🔄 Testing User A Rejoin Scenario...');

async function testRejoin() {
  // 1. Coordinator creates room
  const adminSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((r) => adminSocket.on('connect', r));
  const createRes = await new Promise((r) => adminSocket.emit('create_room', {}, r));
  const { roomId, adminToken } = createRes;
  console.log('✅ Room created:', roomId);

  // 2. User A ("Alpha Team") joins
  let userASocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((r) => userASocket.on('connect', r));

  const join1 = await new Promise((r) => {
    userASocket.emit('join_room', { roomId, name: 'Alpha Team' }, r);
  });
  console.log('✅ User A initially joined room! Participant ID:', join1.participant.participantId);
  const participantId = join1.participant.participantId;

  // 3. User A unfortunately leaves the room
  console.log('🚪 User A leaves the room...');
  await new Promise((r) => {
    userASocket.emit('leave_room', { roomId, participantId }, r);
  });
  userASocket.disconnect();

  // Wait a moment
  await new Promise((r) => setTimeout(r, 100));

  // 4. User A attempts to REJOIN the room with the SAME name ("Alpha Team")
  console.log('🔁 User A reconnecting and rejoining...');
  userASocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((r) => userASocket.on('connect', r));

  const rejoinRes = await new Promise((r) => {
    userASocket.emit('join_room', {
      roomId,
      name: 'Alpha Team',
      participantId,
    }, r);
  });

  if (!rejoinRes.success) {
    console.error('❌ Rejoin failed with error:', rejoinRes.error);
    process.exit(1);
  }

  console.log('✅ Rejoin SUCCESS:', rejoinRes.success, 'isReconnect:', rejoinRes.isReconnect);
  console.log('   Rejoined Participant Name:', rejoinRes.participant.name);
  console.log('   Rejoined Participant ID:', rejoinRes.participant.participantId);

  if (rejoinRes.participant.participantId !== participantId) {
    console.error('❌ Participant ID did not match original session!');
    process.exit(1);
  }

  // 5. Test buzzing after rejoin
  await new Promise((r) => {
    adminSocket.emit('start_round', { roomId, adminToken });
    userASocket.on('round_started', r);
  });

  const buzzRes = await new Promise((r) => {
    userASocket.emit('buzz', {
      roomId,
      participantId,
      round: 1,
    }, r);
  });

  console.log('⚡ User A buzzed after rejoin! Status:', buzzRes.status, 'Rank:', buzzRes.rank);
  if (buzzRes.status === 'SUCCESS' && buzzRes.rank === 1) {
    console.log('🎉 REJOIN TEST FULLY PASSED! User A was able to re-enter, maintain identity, and buzz.');
  } else {
    console.error('❌ Buzz after rejoin failed:', buzzRes);
    process.exit(1);
  }

  adminSocket.disconnect();
  userASocket.disconnect();
  process.exit(0);
}

testRejoin().catch((err) => {
  console.error('❌ Rejoin test failed:', err);
  process.exit(1);
});
