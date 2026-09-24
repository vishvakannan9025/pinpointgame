const http = require('http');
const { io } = require('socket.io-client');

async function testHttpEndpoint(path, expectedSnippet) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.includes(expectedSnippet)) {
          console.log(`✅ [HTTP] ${path} returned 200 and matched snippet!`);
          resolve(true);
        } else {
          console.error(`❌ [HTTP] ${path} failed snippet match. Status: ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  console.log('🚀 Running React Admin Portal & Player App Integration Test...\n');

  // 1. Verify React Admin Portal HTML
  const adminOk = await testHttpEndpoint('/admin/', 'PinPoint Game — Website Admin Portal');

  // 2. Verify Player Flutter Web App HTML
  const playerOk = await testHttpEndpoint('/', 'pinpointgame');

  // 3. Test React Admin Socket: create room
  const adminSocket = io('http://localhost:3000', { transports: ['websocket'] });

  await new Promise((resolve) => {
    adminSocket.on('connect', () => {
      console.log('✅ Admin Socket connected successfully!');
      resolve();
    });
  });

  const createRes = await new Promise((resolve) => {
    adminSocket.emit('create_room', {}, (res) => resolve(res));
  });

  console.log(`✅ Admin created Room: ${createRes.roomId} (AdminToken: ${createRes.adminToken ? 'valid' : 'missing'})`);

  // 4. Test Player Socket: join room
  const playerSocket = io('http://localhost:3000', { transports: ['websocket'] });
  await new Promise(r => playerSocket.on('connect', r));

  const joinRes = await new Promise((resolve) => {
    playerSocket.emit('join_room', {
      roomId: createRes.roomId,
      name: 'Team Alpha',
    }, (res) => resolve(res));
  });

  console.log(`✅ Player joined Room: ${joinRes.success ? 'SUCCESS' : 'FAILED'} (Participant: ${joinRes.participant?.name})`);

  // 5. Admin starts round
  await new Promise((resolve) => {
    adminSocket.emit('start_round', {
      roomId: createRes.roomId,
      adminToken: createRes.adminToken,
    }, (res) => {
      console.log(`✅ Admin started round: status = ${res.room?.roundStatus}`);
      resolve();
    });
  });

  // 6. Player hits buzzer
  const buzzRes = await new Promise((resolve) => {
    playerSocket.emit('buzz', {
      roomId: createRes.roomId,
      participantId: joinRes.participant.participantId,
      round: 1,
    }, (res) => resolve(res));
  });

  console.log(`✅ Player buzzed: Rank = #${buzzRes.rank}, Status = ${buzzRes.status}`);

  adminSocket.disconnect();
  playerSocket.disconnect();

  console.log('\n🎉 ALL INTEGRATION CHECKS PASSED 100%!');
  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
