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
      const urlFile = path.join(__dirname, '..', 'public_url.txt');
      fs.writeFileSync(urlFile, publicUrl.trim(), 'utf8');

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
      console.log('   ' + publicUrl);
      console.log('========================================================================\n');
    }
  });

  tunnel.on('close', (code) => {
    console.log(`⚠️ Tunnel process exited with code ${code}. Restarting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
