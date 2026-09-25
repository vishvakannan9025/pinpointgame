import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAdmin } from '../context/AdminContext';

export const NetworkQrHub = () => {
  const { room } = useAdmin();

  const [publicUrl, setPublicUrl] = useState('https://definition-tears-light-frank.trycloudflare.com');
  const [localWifiUrl, setLocalWifiUrl] = useState('http://10.14.241.188:3000');
  const [localhostUrl, setLocalhostUrl] = useState('http://localhost:3000');

  useEffect(() => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🌐</span> NETWORK & QR CONNECTION HUB
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Project these QR codes so participants on mobile phones (Android / iOS) can scan and connect instantly.
          </p>
        </div>

        {room && (
          <div className="pill pill-purple" style={{ padding: '8px 18px', fontSize: '13px' }}>
            PERMANENT ARENA: <strong style={{ color: 'var(--winner-gold)', letterSpacing: '0.08em' }}>{room.roomId}</strong>
          </div>
        )}
      </div>

      {/* QR Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
      }}>
        {/* Public Internet QR */}
        <QrCard
          title="PUBLIC INTERNET (4G / 5G / ANY WI-FI)"
          badge="pill-purple"
          color="#818CF8"
          subtitle="Works for any participant across mobile data (Jio, Airtel, Vi), home broadband, or college Wi-Fi worldwide."
          url={getJoinUrl(publicUrl)}
          rawUrl={publicUrl}
          isPrimary={true}
        />

        {/* Local Wi-Fi QR */}
        <QrCard
          title="LOCAL WI-FI (OFFLINE CAMPUS LAN)"
          badge="pill-green"
          color="#34D399"
          subtitle="Direct local network connection — zero internet required when players and server are on the same router."
          url={getJoinUrl(localWifiUrl)}
          rawUrl={localWifiUrl}
          isPrimary={false}
        />

        {/* Localhost QR */}
        <QrCard
          title="LOCALHOST (THIS PC)"
          badge="pill-blue"
          color="#38BDF8"
          subtitle="Direct loopback for local browser testing and presentation on the host machine."
          url={getJoinUrl(localhostUrl)}
          rawUrl={localhostUrl}
          isPrimary={false}
        />
      </div>
    </div>
  );
};

const QrCard = ({ title, badge, subtitle, url, color, isPrimary }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      border: isPrimary ? '2px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-glass)',
      boxShadow: isPrimary ? '0 10px 40px rgba(99, 102, 241, 0.25)' : 'var(--shadow-card)',
    }}>
      <span className={`pill ${badge}`} style={{ marginBottom: '12px' }}>
        {title}
      </span>
      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '22px', minHeight: '38px', lineHeight: 1.5 }}>
        {subtitle}
      </p>

      {/* QR Code Container with Glow */}
      <div style={{
        padding: '16px',
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: `0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${isPrimary ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
        display: 'inline-block',
        marginBottom: '18px',
        border: '3px solid rgba(255, 255, 255, 0.9)',
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
        marginBottom: '18px',
        maxWidth: '280px',
        fontFamily: 'var(--font-mono)',
        padding: '6px 12px',
        borderRadius: '8px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        {url}
      </div>

      <button
        onClick={handleCopy}
        className={`btn ${copied ? 'btn-success' : 'btn-secondary'} btn-sm`}
        style={{ width: '100%', padding: '10px 18px', fontWeight: 800 }}
      >
        {copied ? '✓ Link Copied to Clipboard!' : '📋 Copy Connection Link'}
      </button>
    </div>
  );
};
