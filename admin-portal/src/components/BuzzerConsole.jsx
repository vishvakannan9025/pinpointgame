import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export const BuzzerConsole = () => {
  const {
    room,
    createRoom,
    startRound,
    lockRound,
    resetBuzzer,
    resetRound,
    endRoom,
    kickParticipant,
    clearAllParticipants,
    questions,
    activeQuestionIndex,
    isAnswerRevealed,
    revealedClueCount,
    revealNextClue,
    resetClues,
    revealAnswer,
    setActiveQuestion,
  } = useAdmin();

  const [copiedCode, setCopiedCode] = useState(false);

  const currentQ = questions && questions[activeQuestionIndex];

  const handleCopyCode = () => {
    if (room && room.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleEndRoom = () => {
    if (window.confirm('Are you sure you want to close this room session? All players will be disconnected.')) {
      endRoom();
    }
  };

  const handleClearAllTeams = () => {
    if (window.confirm('Are you sure you want to remove ALL participants and clear the buzz list?')) {
      clearAllParticipants();
    }
  };

  if (!room) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 36px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
            border: '2px solid rgba(99, 102, 241, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Connect to PinPoint Arena</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
            Initialize the server-authoritative buzzer arena for participants across mobile data and Wi-Fi networks.
          </p>
          <button
            onClick={createRoom}
            className="btn btn-primary btn-lg pulsing-glow"
            style={{ padding: '16px 40px', fontSize: '15px', width: '100%' }}
          >
            ⚡ CONNECT TO DEFAULT ARENA (PINPOINT)
          </button>
        </div>
      </div>
    );
  }

  const isActive = room.roundStatus === 'ACTIVE';
  const isLocked = room.roundStatus === 'LOCKED';
  const queue = room.buzzQueue || [];
  const participants = room.participants || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Arena Dashboard Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.5)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        {/* Arena ID & Copy */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--accent-cyan)',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            ACTIVE GAME ARENA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '36px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: 'var(--winner-gold)',
              textShadow: '0 0 25px rgba(251, 191, 36, 0.4)',
            }}>
              {room.roomId}
            </span>
            <button
              onClick={handleCopyCode}
              className="btn btn-secondary btn-sm"
              title="Copy Room Code"
              style={{
                padding: '6px 12px',
                fontSize: '11.5px',
                borderRadius: '8px',
                border: copiedCode ? '1px solid #10B981' : '1px solid var(--border-glass)',
                color: copiedCode ? '#34D399' : '#FFFFFF',
              }}
            >
              {copiedCode ? '✓ Copied' : '📋 Copy Code'}
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="pill pill-purple" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
            <span>🎯</span> ROUND {room.currentRound}
          </div>
          <div
            className={`pill ${isActive ? 'pill-green' : (isLocked ? 'pill-amber' : 'pill-purple')}`}
            style={{ padding: '8px 18px', fontSize: '12.5px' }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isActive ? '#10B981' : (isLocked ? '#F59E0B' : '#6366F1'),
              boxShadow: isActive ? '0 0 10px #10B981' : 'none',
              display: 'inline-block',
            }} />
            BUZZER: {room.roundStatus}
          </div>
          <div className="pill pill-blue" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
            <span>👥</span> {participants.length} TEAMS CONNECTED
          </div>
        </div>
      </div>

      {/* Buzzer Engine Controls */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '12px',
        }}>
          <div>
            <h3 style={{ fontSize: '15px', letterSpacing: '0.04em', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎮</span> BUZZER ENGINE ACTION CONTROLS
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Server-authoritative atomic state changes broadcast immediately to all player screens.
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}>
            ⚡ Latency: &lt;1ms Local
          </span>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Start Round / Unlock Buzzer */}
          <button
            onClick={startRound}
            className={`btn btn-success btn-lg ${isActive ? '' : 'pulsing-green'}`}
            style={{ fontWeight: 800, padding: '14px 28px' }}
          >
            <span>⚡</span> START ROUND (UNLOCK BUZZER)
          </button>

          {/* Lock Buzzer */}
          <button
            onClick={lockRound}
            className="btn btn-warning btn-lg"
            disabled={!isActive}
            style={{ opacity: !isActive ? 0.45 : 1, padding: '14px 24px' }}
          >
            <span>🔒</span> LOCK BUZZER
          </button>

          {/* Clear Buzzers */}
          <button
            onClick={resetBuzzer}
            className="btn btn-secondary btn-lg"
            style={{ padding: '14px 24px' }}
          >
            <span>🔄</span> CLEAR BUZZERS
          </button>

          {/* Next Round */}
          <button
            onClick={resetRound}
            className="btn btn-primary btn-lg"
            style={{ padding: '14px 24px' }}
          >
            <span>⏭️</span> NEXT ROUND
          </button>

          {/* End Room Session */}
          <button
            onClick={handleEndRoom}
            className="btn btn-danger btn-lg"
            style={{ marginLeft: 'auto', padding: '14px 22px' }}
          >
            <span>🛑</span> END ROOM
          </button>
        </div>
      </div>

      {/* Clue Progression Controller Card */}
      {currentQ && (
        <div className="glass-card" style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 29, 47, 0.9) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                💡
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.12em' }}>
                  STAGE CLUE PROGRESSION (SYNCED TO PROJECTOR)
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  Challenge #{activeQuestionIndex + 1}: {currentQ.question || 'Mystery Subject'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setActiveQuestion(Math.max(0, activeQuestionIndex - 1))}
                disabled={activeQuestionIndex === 0}
                className="btn btn-secondary btn-sm"
                title="Previous Challenge"
              >
                ◀ Prev
              </button>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--accent-cyan)', padding: '0 4px' }}>
                {activeQuestionIndex + 1} / {questions.length}
              </span>
              <button
                onClick={() => setActiveQuestion(Math.min(questions.length - 1, activeQuestionIndex + 1))}
                disabled={activeQuestionIndex >= questions.length - 1}
                className="btn btn-secondary btn-sm"
                title="Next Challenge"
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* 4 Clues Status Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {[1, 2, 3, 4].map((num) => {
              const isRev = revealedClueCount >= num;
              const isCurrent = revealedClueCount === num;
              return (
                <div
                  key={num}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isRev
                      ? (isCurrent
                          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)'
                          : 'rgba(56, 189, 248, 0.1)')
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isRev
                      ? (isCurrent ? '1.5px solid var(--accent-cyan)' : '1px solid rgba(56, 189, 248, 0.4)')
                      : '1px dashed rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: isRev ? '#FFFFFF' : 'var(--text-muted)' }}>
                    CLUE #{num}
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: isRev ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.3)',
                    background: isRev ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}>
                    {isRev ? '✓ REVEALED' : '🔒 LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progressive Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            {revealedClueCount < 4 ? (
              <button
                onClick={revealNextClue}
                className="btn btn-primary btn-md pulsing-glow"
                style={{
                  padding: '12px 28px',
                  fontWeight: 900,
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)',
                }}
              >
                🔍 REVEAL CLUE {revealedClueCount + 1} ON STAGE
              </button>
            ) : !isAnswerRevealed ? (
              <button
                onClick={() => revealAnswer(true)}
                className="btn btn-warning btn-md pulsing-glow"
                style={{
                  padding: '12px 32px',
                  fontWeight: 900,
                  fontSize: '14px',
                  color: '#000000',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                }}
              >
                🎉 REVEAL FINAL ANSWER ON STAGE
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1.5px solid var(--winner-gold)',
                  color: 'var(--winner-gold)',
                  fontWeight: 900,
                  fontSize: '14px',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.25)',
                }}>
                  🏆 ANSWER: {currentQ.answer || (currentQ.options && currentQ.options[currentQ.correctOptionIndex])}
                </div>
                <button onClick={resetClues} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
                  🔄 Reset Clues
                </button>
              </div>
            )}

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Flow: Clue 1 → Clue 2 → Clue 3 → Clue 4 → Reveal Answer
            </div>
          </div>
        </div>
      )}

      {/* Grid: Live Millisecond Standings + Team Roster */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
      }}>
        {/* Live Millisecond Standings */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--winner-gold)' }}>🏆</span> LIVE BUZZER STANDINGS
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="pill pill-purple" style={{ fontSize: '11px', padding: '4px 10px' }}>
                {queue.length} Pressed
              </span>
              {queue.length > 0 && (
                <button
                  onClick={resetBuzzer}
                  className="btn btn-secondary btn-sm"
                  title="Clear buzzer standings"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Clear List
                </button>
              )}
            </div>
          </div>

          {queue.length === 0 ? (
            <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '38px', marginBottom: '12px' }}>⏳</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#FFFFFF', marginBottom: '6px' }}>
                Waiting for Participants to Buzz
              </div>
              <div style={{ fontSize: '12.5px' }}>
                Press <strong>Start Round</strong> above to unlock the buzzers for all teams.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {queue.map((entry, idx) => {
                const isFirst = entry.rank === 1;

                return (
                  <div
                    key={entry.participantId || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: isFirst
                        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                        : 'var(--bg-input)',
                      border: isFirst ? '2px solid rgba(251, 191, 36, 0.7)' : '1px solid var(--border-glass)',
                      boxShadow: isFirst ? '0 0 25px rgba(251, 191, 36, 0.25)' : 'none',
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: '15px',
                      color: isFirst ? '#000000' : '#FFFFFF',
                      background: isFirst ? 'var(--winner-gold)' : 'rgba(255, 255, 255, 0.1)',
                      marginRight: '16px',
                      flexShrink: 0,
                    }}>
                      #{entry.rank}
                    </div>

                    {/* Team Name & Delta */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: isFirst ? 900 : 700,
                        fontSize: '16px',
                        color: isFirst ? '#FFFFFF' : 'var(--text-primary)',
                      }}>
                        {entry.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: isFirst ? 'var(--winner-gold)' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        marginTop: '2px',
                      }}>
                        {isFirst ? '🥇 1st PLACE (0 ms offset)' : `+${entry.timeOffsetMs} ms behind #1`}
                      </div>
                    </div>

                    {isFirst && (
                      <span style={{ fontSize: '24px' }}>👑</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Team Roster */}
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>👥</span> TEAM ROSTER
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="pill pill-blue" style={{ fontSize: '11px', padding: '4px 10px' }}>
                {participants.length} Registered
              </span>
              {participants.length > 0 && (
                <button
                  onClick={handleClearAllTeams}
                  className="btn btn-outline btn-sm"
                  title="Remove all participants"
                  style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--status-red)' }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {participants.length === 0 ? (
            <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '38px', marginBottom: '12px' }}>📱</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#FFFFFF', marginBottom: '6px' }}>
                No Teams Joined Yet
              </div>
              <div style={{ fontSize: '12.5px' }}>
                Share Arena Code <strong>{room.roomId}</strong> or check the Network & QR tab to onboard teams.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {participants.map((p) => (
                <div
                  key={p.participantId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: p.isConnected ? '#10B981' : '#EF4444',
                    boxShadow: p.isConnected ? '0 0 8px #10B981' : 'none',
                    marginRight: '12px',
                    display: 'inline-block',
                  }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>
                    {p.name}
                  </span>

                  {p.hasBuzzed && (
                    <span className="pill pill-red" style={{ marginRight: '10px', fontSize: '10px', padding: '3px 10px' }}>
                      ⚡ BUZZED
                    </span>
                  )}

                  <button
                    onClick={() => kickParticipant(p.participantId)}
                    className="btn btn-outline btn-sm"
                    title="Kick participant"
                    style={{ padding: '4px 10px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--status-red)', fontSize: '11px' }}
                  >
                    Kick
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
