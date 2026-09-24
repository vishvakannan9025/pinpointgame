import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAdmin } from '../context/AdminContext';

export const NetworkQrHub = () => {
  const { room, serverUrl, setServerUrl } = useAdmin();
  const [customInput, setCustomInput] = useState(serverUrl);

  const [publicUrl, setPublicUrl] = useState('https://but-environment-notify-succeed.trycloudflare.com');
  const [localWifiUrl, setLocalWifiUrl] = useState('http://10.14.241.188:3000');
  const [localhostUrl, setLocalhostUrl] = useState('http://localhost:3000');

  React.useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await fetch('/api/network-info');
        if (res.ok) {
          const data = await res.json();
          if (data.publicUrl) setPublicUrl(data.publicUrl);
          if (data.localWifiUrl) setLocalWifiUrl(data.localWifiUrl);
          if (data.localhostUrl) setLocalhostUrl(data.localhostUrl);
        }
      } catch (_) {}
    };
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  const getJoinUrl = (base) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/#/join`;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px' }}>NETWORK & QR CONNECTION HUB</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Project these QR codes so participants on mobile phones can scan and join the room instantly.
        </p>
      </div>

      {/* QR Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
      }}>
        {/* Public Tunnel QR */}
        <QrCard
          title="PUBLIC INTERNET (4G / 5G / ANY WI-FI)"
          badge="pill-purple"
          subtitle="Cloudflare Public Tunnel — Works for any participant across any network worldwide."
          url={getJoinUrl(publicUrl)}
          rawUrl={publicUrl}
          onCopy={() => handleCopy(getJoinUrl(publicUrl))}
        />

        {/* Local Wi-Fi QR */}
        <QrCard
          title="LOCAL WI-FI (OFFLINE CAMPUS LAN)"
          badge="pill-green"
          subtitle="Direct local network connection — Zero internet required when players and server are on the same Wi-Fi."
          url={getJoinUrl(localWifiUrl)}
          rawUrl={localWifiUrl}
          onCopy={() => handleCopy(getJoinUrl(localWifiUrl))}
        />

        {/* Localhost QR */}
        <QrCard
          title="LOCALHOST (THIS PC)"
          badge="pill-blue"
          subtitle="Direct loopback for local browser testing on the host machine."
          url={getJoinUrl(localhostUrl)}
          rawUrl={localhostUrl}
          onCopy={() => handleCopy(getJoinUrl(localhostUrl))}
        />
      </div>
    </div>
  );
};

const QrCard = ({ title, badge, subtitle, url, rawUrl, onCopy }) => {
  return (
    <div className="glass-card" style={{
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <span className={`pill ${badge}`} style={{ marginBottom: '10px' }}>
        {title}
      </span>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', minHeight: '36px', lineHeight: 1.4 }}>
        {subtitle}
      </p>

      {/* High contrast QR Code Box */}
      <div style={{
        padding: '16px',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
        display: 'inline-block',
        marginBottom: '16px',
      }}>
        <QRCodeSVG
          value={url}
          size={180}
          level="H"
          includeMargin={false}
        />
      </div>

      <div style={{
        fontSize: '11.5px',
        color: 'var(--text-muted)',
        wordBreak: 'break-all',
        marginBottom: '14px',
        maxWidth: '280px',
        fontFamily: 'monospace',
      }}>
        {url}
      </div>

      <button onClick={onCopy} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
        📋 Copy Connection Link
      </button>
    </div>
  );
};
