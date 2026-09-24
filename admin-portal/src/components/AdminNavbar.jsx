import React from 'react';
import { useAdmin } from '../context/AdminContext';

export const AdminNavbar = () => {
  const {
    isConnected,
    latencyMs,
    room,
    activeTab,
    setActiveTab,
    logout,
  } = useAdmin();

  const handleCopyRoom = () => {
    if (room && room.roomId) {
      navigator.clipboard.writeText(room.roomId);
      alert(`Room Code ${room.roomId} copied to clipboard!`);
    }
  };

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Top Bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            fontSize: '18px',
          }}>
            🔴
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#FFFFFF',
            }}>
              PINPOINT GAME <span style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>ADMIN PORTAL</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Master Host Control Center
            </div>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Active Room Badge */}
          {room && (
            <button
              onClick={handleCopyRoom}
              className="pill pill-purple"
              style={{
                cursor: 'pointer',
                border: '1px solid rgba(99, 102, 241, 0.6)',
                fontSize: '11.5px',
                padding: '6px 12px',
              }}
              title="Click to copy room code"
            >
              ROOM: <strong style={{ color: 'var(--winner-gold)' }}>{room.roomId}</strong> 📋
            </button>
          )}

          {/* Connection & Latency Badge */}
          <div
            className={`pill ${isConnected ? 'pill-green' : 'pill-red'}`}
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isConnected ? 'var(--status-green)' : 'var(--status-red)',
              display: 'inline-block',
            }} />
            {isConnected ? (latencyMs !== null ? `${latencyMs} ms` : 'Connected') : 'Offline'}
          </div>

          {/* Launch Stage Projector View */}
          <button
            onClick={() => setActiveTab('projector')}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--accent-cyan)' }}
          >
            📺 Projector Screen
          </button>

          {/* Lock Portal */}
          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            title="Lock Admin Portal"
            style={{ padding: '6px 10px' }}
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        gap: '4px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <TabButton
          active={activeTab === 'buzzer'}
          onClick={() => setActiveTab('buzzer')}
          icon="🎮"
          label="Room & Buzzer"
        />
        <TabButton
          active={activeTab === 'questions'}
          onClick={() => setActiveTab('questions')}
          icon="📝"
          label="Question Bank"
        />
        <TabButton
          active={activeTab === 'projector'}
          onClick={() => setActiveTab('projector')}
          icon="📽️"
          label="Stage Projector"
        />
        <TabButton
          active={activeTab === 'network'}
          onClick={() => setActiveTab('network')}
          icon="🌐"
          label="Network & QR"
        />
      </div>
    </header>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      borderBottom: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
      padding: '12px 18px',
      color: active ? '#FFFFFF' : 'var(--text-muted)',
      fontFamily: 'var(--font-heading)',
      fontSize: '13px',
      fontWeight: 700,
      letterSpacing: '0.02em',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.15s ease',
    }}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);
