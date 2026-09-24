const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const urlFile = path.join(__dirname, '..', 'public_url.txt');
const PUBLIC_URL = fs.existsSync(urlFile) ? fs.readFileSync(urlFile, 'utf8').trim() : 'https://honolulu-media-round-property.trycloudflare.com';

console.log('🌐 Testing Pure WebSocket & Buzzer across Cloudflare Tunnel...');
console.log('🔗 URL:', PUBLIC_URL);

async function testTunnel() {
  const socket = io(PUBLIC_URL, {
    transports: ['websocket'], // STRICTLY PURE WEBSOCKET
    forceNew: false,
    reconnection: true,
  });

  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
  });
  console.log('✅ Connected to Cloudflare Tunnel via Pure WebSocket! ID:', socket.id);

  // Ping test
  const sendTime = Date.now();
  const pong = await new Promise((resolve) => {
    socket.emit('latency_ping', sendTime, resolve);
  });
  const rtt = Date.now() - sendTime;
  console.log(`⚡ WebSocket RTT via Cloudflare Tunnel: ${rtt} ms`);

  // Create room
  const createRes = await new Promise((resolve) => socket.emit('create_room', {}, resolve));
  console.log('✅ Room created via Tunnel:', createRes.roomId);

  socket.disconnect();
  console.log('🎉 Tunnel pure WebSocket test successful with zero XHR polling!');
  process.exit(0);
}

testTunnel().catch((err) => {
  console.error('❌ Tunnel test error:', err);
  process.exit(1);
});
