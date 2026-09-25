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
    activeRound,
    switchRound,
    teamScores,
    awardPoints,
    adjustPoints,
    resetTeamScores,
  } = useAdmin();

  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedTeamIdForPoints, setSelectedTeamIdForPoints] = useState(null);
  const [scoreTab, setScoreTab] = useState(activeRound === 2 ? 'round2' : 'round1');

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
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>STAGE CLUE PROGRESSION</span>
                  <span style={{
                    background: activeRound === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    color: activeRound === 1 ? 'var(--accent-cyan)' : 'var(--winner-gold)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${activeRound === 1 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                  }}>
                    ROUND {activeRound}
                  </span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  Challenge #{activeQuestionIndex + 1}: {currentQ.question || 'Mystery Subject'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Round Switcher */}
              <div style={{
                display: 'inline-flex',
                background: 'rgba(0,0,0,0.35)',
                padding: '3px',
                borderRadius: '9px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <button
                  onClick={() => switchRound(1)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeRound === 1 ? 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)' : 'transparent',
                    color: activeRound === 1 ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  R1 (20 Qs)
                </button>
                <button
                  onClick={() => switchRound(2)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeRound === 2 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'transparent',
                    color: activeRound === 2 ? '#000000' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  R2 (Movies)
                </button>
              </div>

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

          {/* Clues Status Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {Array.from({ length: (currentQ?.clues?.length || 4) }, (_, i) => i + 1).map((num) => {
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
            {revealedClueCount < (currentQ?.clues?.length || 4) ? (
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
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;
                const teamId = entry.participantId || entry.name;
                const isSelected = selectedTeamIdForPoints === teamId;
                const currentScore = teamScores && teamScores[teamId] ? teamScores[teamId].score : 0;

                const itemBg = isFirst
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%)'
                  : isSecond
                  ? 'linear-gradient(135deg, rgba(226, 232, 240, 0.18) 0%, rgba(148, 163, 184, 0.1) 100%)'
                  : isThird
                  ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.18) 0%, rgba(180, 83, 9, 0.1) 100%)'
                  : 'var(--bg-input)';

                const itemBorder = isFirst
                  ? '2px solid rgba(251, 191, 36, 0.8)'
                  : isSecond
                  ? '2px solid rgba(203, 213, 225, 0.8)'
                  : isThird
                  ? '2px solid rgba(205, 127, 50, 0.8)'
                  : '1px solid var(--border-glass)';

                const itemGlow = isFirst
                  ? '0 0 25px rgba(251, 191, 36, 0.25)'
                  : isSecond
                  ? '0 0 16px rgba(203, 213, 225, 0.2)'
                  : isThird
                  ? '0 0 16px rgba(205, 127, 50, 0.2)'
                  : 'none';

                const rankBg = isFirst
                  ? 'var(--winner-gold)'
                  : isSecond
                  ? '#E2E8F0'
                  : isThird
                  ? '#CD7F32'
                  : 'rgba(255, 255, 255, 0.1)';

                const rankColor = isFirst || isSecond ? '#000000' : '#FFFFFF';

                return (
                  <div
                    key={teamId || idx}
                    onClick={() => setSelectedTeamIdForPoints(isSelected ? null : teamId)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: itemBg,
                      border: itemBorder,
                      boxShadow: itemGlow,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Click team to view/award marks (Clue 1: 4pts, Clue 2: 3pts, Clue 3: 2pts, Clue 4: 1pt)"
                  >
                    {/* Header: Rank, Name, Timing, Score */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
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
                        color: rankColor,
                        background: rankBg,
                        marginRight: '16px',
                        flexShrink: 0,
                        boxShadow: isFirst || isSecond || isThird ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
                      }}>
                        #{entry.rank}
                      </div>

                      {/* Team Name & Delta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: isFirst ? 900 : 700,
                          fontSize: '16px',
                          color: isFirst ? '#FFFFFF' : isSecond ? '#F8FAFC' : isThird ? '#FEF3C7' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: isFirst
                            ? 'var(--winner-gold)'
                            : isSecond
                            ? '#E2E8F0'
                            : isThird
                            ? '#F59E0B'
                            : 'var(--text-muted)',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          marginTop: '2px',
                        }}>
                          {isFirst
                            ? '🥇 1st PLACE (0 ms offset)'
                            : isSecond
                            ? `🥈 2nd PLACE (+${entry.timeOffsetMs} ms)`
                            : isThird
                            ? `🥉 3rd PLACE (+${entry.timeOffsetMs} ms)`
                            : `+${entry.timeOffsetMs} ms behind #1`}
                        </div>
                      </div>

                      {/* Current Score Pill */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: '10px',
                        flexShrink: 0,
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: currentScore > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          color: currentScore > 0 ? 'var(--winner-gold)' : 'var(--text-muted)',
                          border: currentScore > 0 ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                          ⭐ {currentScore} pts
                        </span>
                        {isFirst && <span style={{ fontSize: '22px' }}>👑</span>}
                      </div>
                    </div>

                    {/* Expandable Clue Point Award Buttons */}
                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', letterSpacing: '0.04em', flexWrap: 'wrap', gap: '6px' }}>
                          <span>AWARD MARKS FOR {entry.name.toUpperCase()} (ROUND {activeRound} • {currentQ?.category || 'General'}):</span>
                          <span style={{ color: 'var(--winner-gold)' }}>Current: {currentScore} pts</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, currentQ?.clues?.length || 4)}, 1fr)`, gap: '8px' }}>
                          <button
                            onClick={() => awardPoints(teamId, entry.name, 1)}
                            className="btn btn-sm"
                            style={{
                              padding: '8px 4px',
                              fontSize: '11.5px',
                              fontWeight: 900,
                              background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title="Award 4 points for solving on Clue 1"
                          >
                            <span>Clue 1</span>
                            <span style={{ fontSize: '12px', color: '#BAE6FD' }}>+4 pts</span>
                          </button>
                          <button
                            onClick={() => awardPoints(teamId, entry.name, 2)}
                            className="btn btn-sm"
                            style={{
                              padding: '8px 4px',
                              fontSize: '11.5px',
                              fontWeight: 900,
                              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title="Award 3 points for solving on Clue 2"
                          >
                            <span>Clue 2</span>
                            <span style={{ fontSize: '12px', color: '#A7F3D0' }}>+3 pts</span>
                          </button>
                          {(currentQ?.clues?.length || 4) >= 3 && (
                            <button
                              onClick={() => awardPoints(teamId, entry.name, 3)}
                              className="btn btn-sm"
                              style={{
                                padding: '8px 4px',
                                fontSize: '11.5px',
                                fontWeight: 900,
                                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                                color: '#000000',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                              title="Award 2 points for solving on Clue 3"
                            >
                              <span>Clue 3</span>
                              <span style={{ fontSize: '12px', fontWeight: 900 }}>+2 pts</span>
                            </button>
                          )}
                          {(currentQ?.clues?.length || 4) >= 4 && (
                            <button
                              onClick={() => awardPoints(teamId, entry.name, 4)}
                              className="btn btn-sm"
                              style={{
                                padding: '8px 4px',
                                fontSize: '11.5px',
                                fontWeight: 900,
                                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                              title="Award 1 point for solving on Clue 4"
                            >
                              <span>Clue 4</span>
                              <span style={{ fontSize: '12px', color: '#DDD6FE' }}>+1 pt</span>
                            </button>
                          )}
                        </div>
                      </div>
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

      {/* ─── LIVE TEAM SCOREBOARD & MARKS TABLE ─── */}
      <div className="glass-card" style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>SCORING ENGINE</span>
              <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                RULE: CLUE 1 = 4pts • CLUE 2 = 3pts • CLUE 3 = 2pts • CLUE 4 = 1pt
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> LIVE SCOREBOARD & MARKS TABLE
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all team scores to zero?')) {
                  resetTeamScores();
                }
              }}
              className="btn btn-outline btn-sm"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: 'var(--status-red)',
                fontSize: '11.5px',
                padding: '6px 12px',
              }}
            >
              🔄 Reset All Scores
            </button>
          </div>
        </div>

        {/* Round Filter Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setScoreTab('round1')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: scoreTab === 'round1' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: scoreTab === 'round1' ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(79, 70, 229, 0.25) 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: scoreTab === 'round1' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>📁</span>
            <span>ROUND 1 STANDINGS</span>
            <span style={{
              fontSize: '10px',
              background: 'rgba(56, 189, 248, 0.25)',
              color: 'var(--accent-cyan)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: 900,
            }}>
              Category Wise
            </span>
          </button>

          <button
            onClick={() => setScoreTab('round2')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: scoreTab === 'round2' ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
              background: scoreTab === 'round2' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.25) 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: scoreTab === 'round2' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🎬</span>
            <span>ROUND 2 STANDINGS</span>
            <span style={{
              fontSize: '10px',
              background: 'rgba(245, 158, 11, 0.25)',
              color: 'var(--winner-gold)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: 900,
            }}>
              Category Wise
            </span>
          </button>

          <button
            onClick={() => setScoreTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: scoreTab === 'all' ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
              background: scoreTab === 'all' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.25) 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: scoreTab === 'all' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🏆</span>
            <span>OVERALL TOTAL</span>
          </button>
        </div>

        {/* Scoreboard List */}
        {(() => {
          const allEntries = Object.entries(teamScores || {});
          if (allEntries.length === 0) {
            return (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏆</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#FFFFFF', marginBottom: '6px' }}>
                  No Marks Awarded Yet
                </div>
                <div style={{ fontSize: '13px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.5 }}>
                  Click any team in the <strong>Live Buzzer Standings</strong> above and choose which clue they solved on (<strong>Clue 1 = 4pts</strong>, <strong>Clue 2 = 3pts</strong>, <strong>Clue 3 = 2pts</strong>, <strong>Clue 4 = 1pt</strong>) to award marks instantly!
                </div>
              </div>
            );
          }

          const sortedEntries = allEntries.slice().sort((a, b) => {
            const dataA = a[1];
            const dataB = b[1];
            if (scoreTab === 'round1') {
              const sA = dataA.round1Score !== undefined ? dataA.round1Score : dataA.score;
              const sB = dataB.round1Score !== undefined ? dataB.round1Score : dataB.score;
              return sB - sA;
            }
            if (scoreTab === 'round2') {
              const sA = dataA.round2Score !== undefined ? dataA.round2Score : 0;
              const sB = dataB.round2Score !== undefined ? dataB.round2Score : 0;
              return sB - sA;
            }
            return (dataB.score || 0) - (dataA.score || 0);
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedEntries.map(([teamId, data], index) => {
                const rankNum = index + 1;
                const isFirst = rankNum === 1;
                const isSecond = rankNum === 2;
                const isThird = rankNum === 3;

                const displayScore = scoreTab === 'round1'
                  ? (data.round1Score !== undefined ? data.round1Score : data.score)
                  : scoreTab === 'round2'
                  ? (data.round2Score !== undefined ? data.round2Score : 0)
                  : data.score;

                const categoryEntries = Object.entries(data.categoryScores || {});

                return (
                  <div
                    key={teamId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: isFirst
                        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%)'
                        : isSecond
                        ? 'linear-gradient(135deg, rgba(226, 232, 240, 0.14) 0%, rgba(148, 163, 184, 0.06) 100%)'
                        : isThird
                        ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.14) 0%, rgba(180, 83, 9, 0.06) 100%)'
                        : 'var(--bg-input)',
                      border: isFirst
                        ? '1.8px solid var(--winner-gold)'
                        : isSecond
                        ? '1.8px solid #CBD5E1'
                        : isThird
                        ? '1.8px solid #CD7F32'
                        : '1px solid var(--border-glass)',
                      boxShadow: isFirst ? '0 0 20px rgba(251, 191, 36, 0.2)' : 'none',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {/* Rank & Team Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '14px',
                        color: isFirst || isSecond ? '#000000' : '#FFFFFF',
                        background: isFirst ? 'var(--winner-gold)' : isSecond ? '#E2E8F0' : isThird ? '#CD7F32' : 'rgba(255, 255, 255, 0.1)',
                      }}>
                        #{rankNum}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{data.name || teamId}</span>
                          {isFirst && <span>👑</span>}
                        </div>

                        {/* Category Score Badges */}
                        {categoryEntries.length > 0 ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {categoryEntries.map(([cat, pts]) => (
                              <span
                                key={cat}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  color: 'var(--accent-cyan)',
                                }}
                              >
                                {cat}: <strong style={{ color: '#FFFFFF' }}>{pts} pts</strong>
                              </span>
                            ))}
                          </div>
                        ) : data.lastAwardedClue ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Last awarded: Clue #{data.lastAwardedClue} (+{data.lastPointsAwarded} pts)
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Score display & Adjustments */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        <span style={{
                          fontSize: '22px',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          color: isFirst ? 'var(--winner-gold)' : 'var(--accent-cyan)',
                        }}>
                          {displayScore}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                          PTS
                        </span>
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => adjustPoints(teamId, data.name, -1)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800 }}
                          title="Subtract 1 point"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustPoints(teamId, data.name, 1)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#10B981' }}
                          title="Add 1 point"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => adjustPoints(teamId, data.name, 2)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}
                          title="Add 2 points"
                        >
                          +2
                        </button>
                        <button
                          onClick={() => adjustPoints(teamId, data.name, 3)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#0284C7' }}
                          title="Add 3 points"
                        >
                          +3
                        </button>
                        <button
                          onClick={() => adjustPoints(teamId, data.name, 4)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#A855F7' }}
                          title="Add 4 points"
                        >
                          +4
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
