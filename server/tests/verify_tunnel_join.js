const io = require('socket.io-client');

async function testTunnelJoin() {
  const tunnelUrl = 'https://harvard-conversations-artificial-mississippi.trycloudflare.com';
  console.log(`🌐 Testing Student Join via Cloudflare Tunnel: ${tunnelUrl}...`);

  // 1. Connect Admin
  const adminSocket = io(tunnelUrl, { transports: ['websocket'] });
  await new Promise((resolve, reject) => {
    adminSocket.on('connect', resolve);
    adminSocket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Admin tunnel connection timeout')), 8000);
  });
  console.log('✅ Admin connected through Cloudflare tunnel!');

  // 2. Admin creates room
  const createRes = await new Promise((resolve) => {
    adminSocket.emit('create_room', {}, resolve);
  });
  console.log(`🏠 Room created: ${createRes.roomId}`);
  const roomId = createRes.roomId;

  // 3. Connect Student
  const studentSocket = io(tunnelUrl, { transports: ['websocket'] });
  await new Promise((resolve, reject) => {
    studentSocket.on('connect', resolve);
    studentSocket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Student tunnel connection timeout')), 8000);
  });
  console.log('✅ Student connected through Cloudflare tunnel!');

  // 4. Student Joins default arena (NO roomId needed!)
  const joinRes = await new Promise((resolve) => {
    studentSocket.emit('join_room', { name: 'Mobile 4G Player' }, resolve);
  });

  if (joinRes.success) {
    console.log(`🎉 Student joined default arena "${joinRes.room.roomId}" successfully! Name: ${joinRes.participant.name}`);
  } else {
    console.error(`❌ Join failed: ${joinRes.error}`);
    process.exit(1);
  }

  adminSocket.disconnect();
  studentSocket.disconnect();
  console.log('🌟 END-TO-END PUBLIC CLOUDFLARE TUNNEL JOIN TEST PASSED!');
}

testTunnelJoin().catch((err) => {
  console.error('Test error:', err.message);
  process.exit(1);
});
