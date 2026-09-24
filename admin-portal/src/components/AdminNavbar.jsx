import React, { useState } from 'react';
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

  const [copied, setCopied] = useState(false);

  const handleCopyRoom = () => {
    if (room && room.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header style={{
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Top Bar */}
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        {/* Brand with Glowing Cyber Buzzer Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            fontSize: '20px',
            position: 'relative',
          }}>
            ⚡
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10B981',
              border: '2px solid #0B1120',
              boxShadow: '0 0 8px #10B981',
            }} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '17px',
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              PINPOINT <span style={{
                background: 'linear-gradient(90deg, #38BDF8, #818CF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.12em',
              }}>ARENA PORTAL</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Server-Authoritative Realtime Buzzer Host
            </div>
          </div>
        </div>

        {/* Status Indicators & Fast Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Active Room Badge with Copy Feedback */}
          {room && (
            <button
              onClick={handleCopyRoom}
              className="pill"
              style={{
                cursor: 'pointer',
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                border: copied ? '1px solid #10B981' : '1px solid rgba(99, 102, 241, 0.5)',
                color: copied ? '#34D399' : '#FFFFFF',
                fontSize: '12px',
                padding: '7px 16px',
                transition: 'all 0.2s ease',
              }}
              title="Click to copy Arena Code"
            >
              <span>{copied ? '✓ COPIED:' : 'ARENA:'}</span>
              <strong style={{ color: 'var(--winner-gold)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                {room.roomId}
              </strong>
            </button>
          )}

          {/* Connection & Latency Badge */}
          <div
            className={`pill ${isConnected ? 'pill-green' : 'pill-red'}`}
            style={{ fontSize: '11.5px', padding: '7px 14px' }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#10B981' : '#EF4444',
              display: 'inline-block',
              boxShadow: isConnected ? '0 0 10px #10B981' : '0 0 10px #EF4444',
            }} />
            {isConnected ? (
              <span>
                {latencyMs !== null ? (
                  <><strong>{latencyMs}</strong> ms</>
                ) : (
                  'Connected'
                )}
              </span>
            ) : (
              'Disconnected'
            )}
          </div>

          {/* Stage Projector Quick Launch */}
          <button
            onClick={() => setActiveTab('projector')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'projector'
                ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                : 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              fontWeight: 800,
            }}
          >
            📺 Projector Screen
          </button>

          {/* Lock Portal */}
          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            title="Lock Admin Portal"
            style={{ padding: '7px 12px', fontSize: '11.5px', color: 'var(--text-muted)' }}
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tab Bar */}
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        gap: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <TabButton
          active={activeTab === 'buzzer'}
          onClick={() => setActiveTab('buzzer')}
          icon="🎮"
          label="Live Arena & Buzzer"
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
          label="Auditorium Projector"
        />
        <TabButton
          active={activeTab === 'network'}
          onClick={() => setActiveTab('network')}
          icon="🌐"
          label="Network & QR Hub"
        />
      </div>
    </header>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
      border: 'none',
      borderBottom: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
      padding: '12px 20px',
      color: active ? '#FFFFFF' : 'var(--text-secondary)',
      fontFamily: 'var(--font-heading)',
      fontSize: '13px',
      fontWeight: active ? 800 : 600,
      letterSpacing: '0.02em',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    }}
  >
    <span style={{ fontSize: '15px' }}>{icon}</span>
    <span>{label}</span>
  </button>
);
