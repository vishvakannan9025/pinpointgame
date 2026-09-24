import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export const AdminPasscodeModal = () => {
  const { login } = useAdmin();
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = login(passcode.trim());
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 30%, #151F38 0%, #080C15 70%)',
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 32px',
        textAlign: 'center',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(99, 102, 241, 0.2)',
      }}>
        {/* Shield Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 20px auto',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '2px solid rgba(99, 102, 241, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
        }}>
          🛡️
        </div>

        <h2 style={{ fontSize: '22px', marginBottom: '8px', letterSpacing: '0.04em' }}>
          WEBSITE ADMIN PORTAL
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.5 }}>
          Enter the host security passcode to access room management, live millisecond buzzers, question bank CRUD, and projector controls.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Enter passcode (default: admin123)"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(null);
              }}
              autoFocus
              style={{ paddingRight: '48px', letterSpacing: '0.1em', fontWeight: 600 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div style={{
              color: 'var(--status-red)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            🔓 UNLOCK ADMIN PORTAL
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
          PinPoint Game System — Authorized Host Access Only
        </div>
      </div>
    </div>
  );
};
