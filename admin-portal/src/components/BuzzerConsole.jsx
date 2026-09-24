import React from 'react';
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

  const currentQ = questions && questions[activeQuestionIndex];

  const handleCopyCode = () => {
    if (room && room.roomId) {
      navigator.clipboard.writeText(room.roomId);
      alert(`Room Code ${room.roomId} copied!`);
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
        <div className="glass-card" style={{ maxWidth: '540px', margin: '0 auto', padding: '48px 32px' }}>
          <div style={{ fontSize: '54px', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>PINPOINT Live Arena</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>
            Linking to the permanent PINPOINT arena for all participants across mobile and Wi-Fi networks.
          </p>
          <button
            onClick={createRoom}
            className="btn btn-primary btn-lg"
            style={{ padding: '16px 36px', fontSize: '15px' }}
          >
            ⚡ CONNECT TO PINPOINT ARENA
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Room Banner */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-secondary)' }}>
            DEFAULT LIVE ARENA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '32px',
              fontWeight: 900,
              letterSpacing: '0.1em',
              color: 'var(--winner-gold)',
            }}>
              {room.roomId}
            </span>
            <button
              onClick={handleCopyCode}
              className="btn btn-secondary btn-sm"
              title="Copy Room Code"
              style={{ padding: '4px 10px' }}
            >
              📋 Copy
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="pill pill-blue">
            ROUND {room.currentRound}
          </div>
          <div className={`pill ${isActive ? 'pill-green' : (isLocked ? 'pill-amber' : 'pill-purple')}`}>
            {room.roundStatus}
          </div>
          <div className="pill pill-purple">
            {participants.length} TEAMS JOINED
          </div>
        </div>
      </div>

      {/* Buzzer Engine Controls */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            BUZZER ENGINE CONTROLS
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Instant Server-Authoritative Execution (&lt;1ms)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Start Round / Unlock Buzzer */}
          <button
            onClick={startRound}
            className={`btn btn-success btn-lg ${isActive ? '' : 'pulsing-green'}`}
          >
            ⚡ START ROUND (UNLOCK BUZZER)
          </button>

          {/* Lock Buzzer */}
          <button
            onClick={lockRound}
            className="btn btn-warning btn-lg"
            disabled={!isActive}
            style={{ opacity: !isActive ? 0.5 : 1 }}
          >
            🔒 LOCK BUZZER
          </button>

          {/* Clear Buzzers */}
          <button
            onClick={resetBuzzer}
            className="btn btn-secondary btn-lg"
          >
            🔄 CLEAR BUZZERS
          </button>

          {/* Next Round */}
          <button
            onClick={resetRound}
            className="btn btn-primary btn-lg"
          >
            ⏭️ NEXT ROUND
          </button>

          {/* End Room */}
          <button
            onClick={handleEndRoom}
            className="btn btn-danger btn-lg"
            style={{ marginLeft: 'auto' }}
          >
            🛑 END ROOM
          </button>
        </div>
      </div>

      {/* Clue-Based Progressive Stage Controller */}
      {currentQ && (
        <div className="glass-card" style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.1em' }}>
                  STAGE CLUE PROGRESSION (SYNCED TO PROJECTOR)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                  Challenge #{activeQuestionIndex + 1}: {currentQ.question}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setActiveQuestion(Math.max(0, activeQuestionIndex - 1))}
                disabled={activeQuestionIndex === 0}
                className="btn btn-secondary btn-sm"
                title="Previous Challenge"
              >
                ◀ Prev
              </button>
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

          {/* 4 Clues Status Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            {[1, 2, 3, 4].map((num) => {
              const isRev = revealedClueCount >= num;
              return (
                <div
                  key={num}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isRev ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isRev ? '1px solid var(--accent-cyan)' : '1px dashed rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: isRev ? '#FFFFFF' : 'var(--text-muted)' }}>
                    CLUE #{num}
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: isRev ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.3)' }}>
                    {isRev ? '✓ REVEALED' : '🔒 LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progressive Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            {revealedClueCount < 4 ? (
              <button
                onClick={revealNextClue}
                className="btn btn-primary btn-md pulsing-glow"
                style={{ padding: '10px 24px', fontWeight: 900, fontSize: '14px', background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)' }}
              >
                🔍 REVEAL CLUE {revealedClueCount + 1} ON STAGE
              </button>
            ) : !isAnswerRevealed ? (
              <button
                onClick={() => revealAnswer(true)}
                className="btn btn-warning btn-md pulsing-glow"
                style={{ padding: '10px 26px', fontWeight: 900, fontSize: '14px', color: '#000000', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
              >
                🎉 REVEAL FINAL ANSWER ON STAGE
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid var(--winner-gold)',
                  color: 'var(--winner-gold)',
                  fontWeight: 900,
                  fontSize: '13px',
                }}>
                  🏆 ANSWER: {currentQ.answer || (currentQ.options && currentQ.options[currentQ.correctOptionIndex])}
                </div>
                <button onClick={resetClues} className="btn btn-secondary btn-sm">
                  🔄 Reset Clues
                </button>
              </div>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Flow: Clue 1 → Clue 2 → Clue 3 → Clue 4 → Reveal Answer
            </div>
          </div>
        </div>
      )}

      {/* Grid: Live Leaderboard + Team Roster */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {/* Live Millisecond Leaderboard */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--winner-gold)' }}>🏆</span> LIVE BUZZER STANDINGS
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {queue.length} Pressed
              </span>
              {queue.length > 0 && (
                <button
                  onClick={resetBuzzer}
                  className="btn btn-secondary btn-sm"
                  title="Clear buzzer standings"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Clear List
                </button>
              )}
            </div>
          </div>

          {queue.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <div>Waiting for participants to hit the buzzer...</div>
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
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isFirst ? 'rgba(251, 191, 36, 0.12)' : 'var(--bg-input)',
                      border: isFirst ? '1.5px solid rgba(251, 191, 36, 0.6)' : '1px solid var(--border-subtle)',
                      boxShadow: isFirst ? '0 0 15px rgba(251, 191, 36, 0.2)' : 'none',
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: '14px',
                      color: isFirst ? 'var(--winner-gold)' : (entry.rank === 2 ? '#94A3B8' : (entry.rank === 3 ? '#B45309' : 'var(--text-muted)')),
                      background: isFirst ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255, 0.05)',
                      marginRight: '14px',
                    }}>
                      #{entry.rank}
                    </div>

                    {/* Team Name & Delta */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: isFirst ? 900 : 700,
                        fontSize: '15px',
                        color: isFirst ? '#FFFFFF' : 'var(--text-primary)',
                      }}>
                        {entry.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: isFirst ? 'var(--winner-gold)' : 'var(--text-muted)',
                        fontWeight: 600,
                      }}>
                        {isFirst ? '🥇 1st PLACE (0 ms)' : `+${entry.timeOffsetMs} ms behind #1`}
                      </div>
                    </div>

                    {isFirst && (
                      <span style={{ fontSize: '20px' }}>👑</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Team Roster */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>👥</span> TEAM ROSTER
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {participants.length} Registered
              </span>
              {participants.length > 0 && (
                <button
                  onClick={handleClearAllTeams}
                  className="btn btn-outline btn-sm"
                  title="Remove all participants"
                  style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--status-red)' }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {participants.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📱</div>
              <div>No participants joined yet. Share room code: <strong>{room.roomId}</strong></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {participants.map((p) => (
                <div
                  key={p.participantId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: p.isConnected ? 'var(--status-green)' : 'var(--status-red)',
                    marginRight: '10px',
                    display: 'inline-block',
                  }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '13.5px' }}>
                    {p.name}
                  </span>

                  {p.hasBuzzed && (
                    <span className="pill pill-red" style={{ marginRight: '8px', fontSize: '9.5px', padding: '2px 8px' }}>
                      ⚡ BUZZED
                    </span>
                  )}

                  <button
                    onClick={() => kickParticipant(p.participantId)}
                    className="btn btn-outline btn-sm"
                    title="Kick participant"
                    style={{ padding: '4px 8px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--status-red)' }}
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
