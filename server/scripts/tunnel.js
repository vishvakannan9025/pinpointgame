const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Starting Cloudflare Internet Tunnel for College Buzzer Server...');

const cloudflaredPath = path.join(__dirname, '..', 'cloudflared.exe');

if (!fs.existsSync(cloudflaredPath)) {
  console.error('❌ cloudflared.exe not found at:', cloudflaredPath);
  process.exit(1);
}

function startTunnel() {
  const tunnel = spawn(cloudflaredPath, [
    'tunnel',
    '--url',
    'http://127.0.0.1:3000'
  ]);

  tunnel.stderr.on('data', (data) => {
    const text = data.toString();

    // Auto-detect expired Cloudflare quick tunnel and re-spawn
    if (text.includes('Unauthorized: Tunnel not found') || text.includes('Tunnel not found')) {
      console.log('🔄 Cloudflare quick tunnel expired. Re-spawning fresh tunnel...');
      tunnel.kill();
      return;
    }

    // Exclude api.trycloudflare.com and match only actual tunnel subdomains
    const match = text.match(/https:\/\/(?!api\.)[a-zA-Z0-9\-]+\.trycloudflare\.com/);
    if (match) {
      const publicUrl = match[0];
      const urlFileServer = path.join(__dirname, '..', 'public_url.txt');
      const urlFileRoot = path.join(__dirname, '..', '..', 'public_url.txt');
      fs.writeFileSync(urlFileServer, publicUrl.trim(), 'utf8');
      try { fs.writeFileSync(urlFileRoot, publicUrl.trim(), 'utf8'); } catch (_) {}

      // Automatically sync constants.dart
      const constantsPath = path.join(__dirname, '..', '..', 'lib', 'utils', 'constants.dart');
      if (fs.existsSync(constantsPath)) {
        try {
          let content = fs.readFileSync(constantsPath, 'utf8');
          content = content.replace(
            /static const String defaultPublicTunnelUrl =\s*['"][^'"]+['"];/,
            `static const String defaultPublicTunnelUrl =\n      '${publicUrl.trim()}';`
          );
          fs.writeFileSync(constantsPath, content, 'utf8');
          console.log('🔄 Synchronized constants.dart with new Cloudflare tunnel URL!');
        } catch (e) {
          console.error('Failed to update constants.dart:', e);
        }
      }

      console.log('\n========================================================================');
      console.log('🎉 CLOUDFLARE PUBLIC INTERNET TUNNEL IS ACTIVE!');
      console.log('========================================================================');
      console.log('👉 Public Server URL: ' + publicUrl);
      console.log('📱 Mobile participants on ANY network (4G/5G/Wi-Fi) can join via:');
      console.log('   ' + publicUrl + '/#/join');
      console.log('========================================================================\n');

      // Keep-alive health checker to ensure tunnel stays alive 24/7
      if (global.healthPingInterval) clearInterval(global.healthPingInterval);
      const https = require('https');
      let failedPings = 0;
      global.healthPingInterval = setInterval(() => {
        https.get(`${publicUrl}/api/network-info`, (res) => {
          if (res.statusCode === 200) {
            failedPings = 0;
          } else {
            failedPings++;
          }
        }).on('error', () => {
          failedPings++;
          if (failedPings >= 3) {
            console.log('⚠️ Tunnel health ping failed 3 times. Reconnecting...');
            clearInterval(global.healthPingInterval);
            tunnel.kill();
          }
        });
      }, 25000);
    }
  });

  tunnel.on('close', (code) => {
    if (global.healthPingInterval) clearInterval(global.healthPingInterval);
    console.log(`⚠️ Tunnel process exited with code ${code}. Restarting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
