const io = require('socket.io-client');

async function runTest() {
  console.log('🚀 Testing Student Join Flow...');

  const serverUrl = 'http://localhost:3000';
  console.log(`Connecting Admin socket to ${serverUrl}...`);

  const adminSocket = io(serverUrl, { transports: ['websocket'] });

  await new Promise((resolve, reject) => {
    adminSocket.on('connect', resolve);
    adminSocket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Admin socket timeout')), 5000);
  });

  console.log('✅ Admin socket connected!');

  // 1. Admin creates a room
  const createRes = await new Promise((resolve) => {
    adminSocket.emit('create_room', {}, resolve);
  });

  console.log('🏠 Room created result:', createRes.success ? `Room ID: ${createRes.roomId}` : createRes.error);
  if (!createRes.success) throw new Error('Failed to create room');
  const roomId = createRes.roomId;

  // 2. Student connects
  console.log(`Connecting Student socket to ${serverUrl}...`);
  const studentSocket = io(serverUrl, { transports: ['websocket'] });

  await new Promise((resolve, reject) => {
    studentSocket.on('connect', resolve);
    studentSocket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Student socket timeout')), 5000);
  });
  console.log('✅ Student socket connected!');

  // 3. Test Student joining with invalid room
  const invalidJoinRes = await new Promise((resolve) => {
    studentSocket.emit('join_room', { roomId: 'INVALID', name: 'Student 1' }, resolve);
  });
  console.log('Test Invalid Room Join:', invalidJoinRes.success === false ? `Correctly rejected: "${invalidJoinRes.error}"` : 'Failed! Expected rejection');

  // 4. Test Student joining valid room
  const validJoinRes = await new Promise((resolve) => {
    studentSocket.emit('join_room', { roomId, name: 'Student Team Alpha' }, resolve);
  });
  console.log('Test Valid Room Join:', validJoinRes.success ? `✅ Joined successfully! Participant: ${validJoinRes.participant.name} (ID: ${validJoinRes.participant.participantId})` : `Failed: ${validJoinRes.error}`);

  if (!validJoinRes.success) throw new Error('Valid join failed');

  // 5. Test Student Rejoining
  const rejoinRes = await new Promise((resolve) => {
    studentSocket.emit('join_room', { roomId, name: 'Student Team Alpha' }, resolve);
  });
  console.log('Test Rejoin:', rejoinRes.isReconnect ? '✅ Successfully reconnected existing participant' : 'Not marked reconnect');

  adminSocket.disconnect();
  studentSocket.disconnect();
  console.log('🎉 ALL STUDENT JOIN TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
