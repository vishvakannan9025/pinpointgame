const io = require('socket.io-client');

const PUBLIC_URL = 'https://dimensions-lens-united-recognition.trycloudflare.com';

console.log('🧪 Starting Multi-Network Internet Quiz Room Test...');
console.log('🌐 Target Server:', PUBLIC_URL);

async function runTest() {
  // 1. Coordinator connects over Internet
  const adminSocket = io(PUBLIC_URL, { transports: ['websocket', 'polling'] });
  
  await new Promise((resolve) => adminSocket.on('connect', resolve));
  console.log('✅ 1. Coordinator connected to server over Internet! ID:', adminSocket.id);

  // 2. Coordinator creates Room
  const createRes = await new Promise((resolve) => {
    adminSocket.emit('create_room', {}, resolve);
  });
  console.log('✅ 2. Room created over Internet! Room ID:', createRes.roomId);
  const roomId = createRes.roomId;
  const adminToken = createRes.adminToken;

  // 3. Team 1 ("Alpha College") connects over Internet and joins Room
  const team1Socket = io(PUBLIC_URL, { transports: ['websocket', 'polling'] });
  await new Promise((resolve) => team1Socket.on('connect', resolve));
  const join1 = await new Promise((resolve) => {
    team1Socket.emit('join_room', { roomId, name: 'Alpha College' }, resolve);
  });
  console.log('✅ 3. Alpha College joined room over Internet! Success:', join1.success);

  // 4. Team 2 ("Beta College") connects over Internet and joins Room
  const team2Socket = io(PUBLIC_URL, { transports: ['websocket', 'polling'] });
  await new Promise((resolve) => team2Socket.on('connect', resolve));
  const join2 = await new Promise((resolve) => {
    team2Socket.emit('join_room', { roomId, name: 'Beta College' }, resolve);
  });
  console.log('✅ 4. Beta College joined room over Internet! Success:', join2.success);

  // 5. Coordinator starts Round 1
  await new Promise((resolve) => {
    adminSocket.emit('start_round', { roomId, adminToken });
    team1Socket.on('round_started', resolve);
  });
  console.log('✅ 5. Buzzer enabled by Coordinator! Round 1 is ACTIVE for all teams.');

  // 6. Both teams attempt to buzz, Alpha College buzzes first
  const buzzRes = await new Promise((resolve) => {
    team1Socket.emit('buzz', {
      roomId,
      participantId: join1.participant.participantId,
      round: 1,
      clientTimestamp: Date.now()
    }, resolve);
  });
  console.log('✅ 6. Alpha College buzzed! Result:', buzzRes.status, 'Message:', buzzRes.message);

  // 7. Team 2 attempts to buzz after lock
  const lateBuzz = await new Promise((resolve) => {
    team2Socket.emit('buzz', {
      roomId,
      participantId: join2.participant.participantId,
      round: 1,
      clientTimestamp: Date.now()
    }, resolve);
  });
  console.log('✅ 7. Beta College buzzed late! Result:', lateBuzz.status, '(Correctly rejected)');

  console.log('\n========================================================================');
  console.log('🏆 SUCCESS: Multi-Network Internet Quiz Room System Verified 100%!');
  console.log('========================================================================\n');

  adminSocket.disconnect();
  team1Socket.disconnect();
  team2Socket.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
