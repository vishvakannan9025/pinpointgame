const io = require('socket.io-client');

const socket = io('http://127.0.0.1:3000', {
  transports: ['websocket'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('Connected to server, binding admin...');
  socket.emit('bind_admin', { passcode: 'admin123' }, (res) => {
    console.log('Bind admin response:', res.success, res.roomId);
    if (res.success && res.adminToken) {
      socket.emit('clear_all_participants', {
        roomId: 'PINPOINT',
        adminToken: res.adminToken,
      }, (clearRes) => {
        console.log('Clear all participants response:', clearRes);
        socket.disconnect();
        process.exit(0);
      });
    } else {
      console.error('Failed to bind admin');
      socket.disconnect();
      process.exit(1);
    }
  });
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
