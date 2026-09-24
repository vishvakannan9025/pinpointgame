import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';

export const ProjectorStageView = () => {
  const {
    room,
    questions,
    activeQuestionIndex,
    isAnswerRevealed,
    revealedClueCount,
    revealNextClue,
    resetClues,
    revealAnswer,
    setActiveQuestion,
    startRound,
    lockRound,
    resetBuzzer,
  } = useAdmin();

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // BY DEFAULT: Question occupies the entire screen; buzzer list is hidden until button is pressed
  const [showBuzzerList, setShowBuzzerList] = useState(false);

  // Fullscreen Clue Image Lightbox State
  const [fullscreenImage, setFullscreenImage] = useState(null); // { url, clueNumber, clueText }

  // Sync fullscreen state with browser events (e.g. user presses ESC to exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const target = containerRef.current || document.documentElement;
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {
          // Fallback to CSS fullscreen
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  const currentQ = questions[activeQuestionIndex] || {
    question: 'Mystery Subject',
    clues: [
      'Clue 1 is available. Listen carefully!',
      'Clue 2 reveals more details about the mystery.',
      'Clue 3 narrows down the possible answers.',
      'Clue 4 provides the final giveaway clue!',
    ],
    answer: 'ANSWER',
  };

  const clues = currentQ.clues && currentQ.clues.length >= 4
    ? currentQ.clues.slice(0, 4)
    : [
        ...(currentQ.clues || []),
        'No clue provided.',
        'No clue provided.',
        'No clue provided.',
        'No clue provided.',
      ].slice(0, 4);

  const clueImages = currentQ.clueImages && currentQ.clueImages.length >= 4
    ? currentQ.clueImages.slice(0, 4)
    : [
        ...(currentQ.clueImages || []),
        '', '', '', '',
      ].slice(0, 4);

  const answer = currentQ.answer || (currentQ.options && currentQ.options[currentQ.correctOptionIndex]) || 'REVEALED';

  const queue = room ? room.buzzQueue || [] : [];
  const winner = queue.length > 0 ? queue[0] : null;
  const isActive = room ? room.roundStatus === 'ACTIVE' : false;

  // Progressive button action handler
  const handleProgressiveAction = useCallback(() => {
    if (revealedClueCount < 4) {
      revealNextClue();
    } else if (!isAnswerRevealed) {
      revealAnswer(true);
    } else {
      if (activeQuestionIndex < questions.length - 1) {
        setActiveQuestion(activeQuestionIndex + 1);
      }
    }
  }, [revealedClueCount, isAnswerRevealed, revealNextClue, revealAnswer, activeQuestionIndex, questions.length, setActiveQuestion]);

  // Keyboard shortcuts:
  // Space / ArrowRight: Next clue / reveal answer
  // ArrowLeft: Prev challenge
  // Key B: Toggle Buzzer List
  // Key F: Toggle Fullscreen
  // Key R: Reset clues
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleProgressiveAction();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (activeQuestionIndex > 0) {
          setActiveQuestion(activeQuestionIndex - 1);
        }
      } else if (e.code === 'KeyB' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowBuzzerList((prev) => !prev);
      } else if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetClues();
      } else if (e.key === 'Escape') {
        if (fullscreenImage) {
          e.preventDefault();
          setFullscreenImage(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleProgressiveAction, activeQuestionIndex, setActiveQuestion, resetClues, fullscreenImage]);

  const handlePrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestion(activeQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestion(activeQuestionIndex + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`projector-fullscreen-container ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={{
        minHeight: isFullscreen ? '100vh' : '78vh',
        gap: '16px',
      }}
    >
      {/* Top Header & Stage Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: isFullscreen ? '12px 20px' : '4px 0',
        borderRadius: isFullscreen ? '16px' : '0',
        background: isFullscreen ? 'rgba(15, 23, 42, 0.75)' : 'transparent',
        backdropFilter: isFullscreen ? 'blur(10px)' : 'none',
        border: isFullscreen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
      }}>
        {/* Left: Branding & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h2 style={{
            fontSize: isFullscreen ? '22px' : '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
            letterSpacing: '0.04em',
          }}>
            <span>📽️</span> STAGE PROJECTOR
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-purple" style={{ fontSize: '11.5px', padding: '4px 12px' }}>
              ROUND {room ? room.currentRound : 1}
            </span>
            {room && (
              <span className="pill pill-blue" style={{ fontSize: '11.5px', padding: '4px 12px' }}>
                ARENA: <strong style={{ color: 'var(--winner-gold)' }}>{room.roomId}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls & Side Buzzer List Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Challenge Navigation */}
          <button
            onClick={handlePrevQuestion}
            disabled={activeQuestionIndex === 0}
            className="btn btn-secondary btn-sm"
            title="Previous Challenge (←)"
          >
            ◀ Prev
          </button>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            CHALLENGE {activeQuestionIndex + 1} / {questions.length}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={activeQuestionIndex >= questions.length - 1}
            className="btn btn-secondary btn-sm"
            title="Next Challenge (→)"
          >
            Next ▶
          </button>

          {/* Reset Clues Button */}
          <button
            onClick={resetClues}
            className="btn btn-outline btn-sm"
            title="Reset to Clue 1 (Key R)"
          >
            🔄 Reset
          </button>

          {/* THE BUZZER LIST TOGGLE BUTTON:
              Question occupies entire screen by default.
              Pressing this button slides the buzzer press list in on the side. */}
          <button
            onClick={() => setShowBuzzerList((prev) => !prev)}
            className={`btn btn-sm ${showBuzzerList ? 'btn-secondary' : (queue.length > 0 ? 'btn-warning pulsing-gold-badge' : 'btn-primary')}`}
            style={{
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
            }}
            title="Toggle Buzzer Press List on the side (Key B)"
          >
            <span>{showBuzzerList ? '✕' : '⚡'}</span>
            <span>{showBuzzerList ? 'Hide Buzzer List' : 'Buzzer List'}</span>
            {queue.length > 0 && (
              <span style={{
                background: showBuzzerList ? 'rgba(255,255,255,0.2)' : '#000000',
                color: showBuzzerList ? '#FFFFFF' : 'var(--winner-gold)',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 900,
              }}>
                {queue.length}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="btn btn-outline btn-sm"
            style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
            title="Toggle Fullscreen (Key F)"
          >
            {isFullscreen ? '🗗 Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main Split Layout:
          - Left: Full Screen Question (occupies 100% by default, or calc(100% - 380px) when buzzer list is open)
          - Right: Buzzer Press User List (hidden until button is pressed) */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '20px',
        width: '100%',
        position: 'relative',
        alignItems: 'stretch',
        minHeight: isFullscreen ? 'calc(100vh - 100px)' : '620px',
      }}>
        {/* ============================================================ */}
        {/* 1. MAIN SCREEN: FOCUS ONLY ON QUESTION / CLUES              */}
        {/*    Occupies entire screen by default                         */}
        {/* ============================================================ */}
        <div
          className="glass-card"
          style={{
            flex: 1,
            width: showBuzzerList ? 'calc(100% - 390px)' : '100%',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: isFullscreen ? '36px 48px' : '28px 36px',
            background: 'radial-gradient(circle at 50% 15%, #151F38 0%, #0B101C 85%)',
            border: '2px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header Info Inside Stage */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 900,
              letterSpacing: '0.15em',
              color: 'var(--accent-cyan)',
              textTransform: 'uppercase',
            }}>
              CHALLENGE #{activeQuestionIndex + 1} OF {questions.length}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              {/* If participants have buzzed, show a quick notification badge */}
              {winner && !showBuzzerList && (
                <button
                  onClick={() => setShowBuzzerList(true)}
                  style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid var(--winner-gold)',
                    color: 'var(--winner-gold)',
                    borderRadius: '20px',
                    padding: '4px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Click to view all buzzer standings"
                >
                  <span>👑 First Buzz: {winner.name}</span>
                  <span style={{ fontSize: '10.5px', opacity: 0.8 }}>• Open List ▶</span>
                </button>
              )}

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
              }}>
                ⚡ PINPOINT CLUE SYSTEM
              </span>
            </div>
          </div>

          {/* 4 Progressive Clue Boxes — Full Screen Width */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isFullscreen ? '18px' : '14px',
            margin: '20px 0',
            width: '100%',
          }}>
            {clues.map((clueText, idx) => {
              const clueNumber = idx + 1;
              const isRevealed = revealedClueCount >= clueNumber;
              const isCurrentActive = idx === revealedClueCount - 1;

              return (
                <div
                  key={idx}
                  style={{
                    padding: isFullscreen ? '22px 28px' : '16px 22px',
                    borderRadius: '16px',
                    background: isRevealed
                      ? (isCurrentActive
                          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
                          : 'linear-gradient(135deg, rgba(20, 29, 47, 0.85) 0%, rgba(10, 16, 30, 0.9) 100%)')
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isRevealed
                      ? (isCurrentActive
                          ? '2.5px solid var(--accent-cyan)'
                          : '1.5px solid rgba(99, 102, 241, 0.45)')
                      : '1.5px dashed rgba(255, 255, 255, 0.1)',
                    boxShadow: isRevealed
                      ? (isCurrentActive
                          ? '0 0 30px rgba(56, 189, 248, 0.28), 0 10px 25px rgba(0, 0, 0, 0.5)'
                          : '0 4px 15px rgba(0, 0, 0, 0.35)')
                      : 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isFullscreen ? '24px' : '18px',
                  }}
                >
                  {/* Clue Index Badge */}
                  <div style={{
                    minWidth: isFullscreen ? '110px' : '95px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isFullscreen ? '10px 14px' : '8px 12px',
                    borderRadius: '12px',
                    background: isRevealed
                      ? (isCurrentActive
                          ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                          : 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)')
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isRevealed ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <span style={{
                      fontSize: isFullscreen ? '12px' : '11px',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      color: isRevealed ? '#FFFFFF' : 'var(--text-muted)',
                    }}>
                      CLUE #{clueNumber}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      marginTop: '3px',
                      color: isRevealed ? '#BAE6FD' : 'rgba(255, 255, 255, 0.25)',
                    }}>
                      {isRevealed ? '✓ REVEALED' : '🔒 HIDDEN'}
                    </span>
                  </div>

                  {/* Clue Content */}
                  <div style={{ flex: 1 }}>
                    {isRevealed ? (
                      <div style={{
                        fontSize: isFullscreen ? '20px' : '17px',
                        color: '#FFFFFF',
                        lineHeight: 1.5,
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        animation: 'fadeIn 0.35s ease',
                      }}>
                        {clueText}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: isFullscreen ? '16px' : '14px',
                        color: 'rgba(255, 255, 255, 0.25)',
                        fontStyle: 'italic',
                      }}>
                        Clue #{clueNumber} is currently hidden. Press the button below to reveal...
                      </div>
                    )}
                  </div>

                  {/* Clue Visual Image if revealed & present */}
                  {isRevealed && clueImages[idx] && (
                    <div
                      onClick={() => setFullscreenImage({
                        url: clueImages[idx],
                        clueNumber,
                        clueText,
                      })}
                      style={{
                        position: 'relative',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: isCurrentActive ? '2.5px solid var(--accent-cyan)' : '2px solid rgba(56, 189, 248, 0.6)',
                        boxShadow: isCurrentActive
                          ? '0 8px 30px rgba(56, 189, 248, 0.35), 0 0 20px rgba(0, 0, 0, 0.6)'
                          : '0 6px 20px rgba(0, 0, 0, 0.5)',
                        flexShrink: 0,
                        cursor: 'zoom-in',
                        animation: 'fadeIn 0.4s ease',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      title="Click to view full screen image"
                    >
                      <img
                        src={clueImages[idx]}
                        alt={`Clue #${clueNumber} Visual`}
                        style={{
                          width: isCurrentActive ? (isFullscreen ? '260px' : '200px') : (isFullscreen ? '180px' : '140px'),
                          height: isCurrentActive ? (isFullscreen ? '170px' : '130px') : (isFullscreen ? '115px' : '90px'),
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.82)',
                        color: 'var(--accent-cyan)',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '9.5px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                      }}>
                        <span>⛶</span> FULLSCREEN
                      </div>
                    </div>
                  )}

                  {/* Status Indicator Icon */}
                  <div style={{ fontSize: isFullscreen ? '26px' : '22px', flexShrink: 0 }}>
                    {isRevealed ? '💡' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Revealed Answer Banner (Shown after all 4 clues and user clicks Reveal Answer) */}
          {isAnswerRevealed && (
            <div style={{
              margin: '0 0 20px 0',
              width: '100%',
              padding: isFullscreen ? '28px 36px' : '20px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.22) 0%, rgba(217, 119, 6, 0.28) 100%)',
              border: '2.5px solid var(--winner-gold)',
              boxShadow: '0 0 50px rgba(251, 191, 36, 0.45)',
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.22em',
                color: 'var(--winner-gold)',
                marginBottom: '6px',
              }}>
                🏆 FINAL ANSWER REVEALED
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: isFullscreen ? '44px' : '36px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                textShadow: '0 0 30px rgba(251, 191, 36, 0.7)',
              }}>
                {answer}
              </div>
            </div>
          )}

          {/* Action Button: Clue 1 -> Clue 2 -> Clue 3 -> Clue 4 -> Reveal Answer */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '18px',
          }}>
            {revealedClueCount < 4 ? (
              <button
                onClick={revealNextClue}
                className="btn btn-primary pulsing-glow"
                style={{
                  padding: isFullscreen ? '20px 56px' : '16px 44px',
                  fontSize: isFullscreen ? '20px' : '17px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)',
                  boxShadow: '0 8px 30px rgba(79, 70, 229, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span>🔍</span> REVEAL CLUE {revealedClueCount + 1}
              </button>
            ) : !isAnswerRevealed ? (
              <button
                onClick={() => revealAnswer(true)}
                className="btn btn-warning pulsing-glow"
                style={{
                  padding: isFullscreen ? '20px 60px' : '16px 48px',
                  fontSize: isFullscreen ? '21px' : '18px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#000000',
                  boxShadow: '0 8px 35px rgba(245, 158, 11, 0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span>🎉</span> REVEAL FINAL ANSWER
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={resetClues}
                  className="btn btn-secondary btn-lg"
                  style={{ padding: '14px 28px', fontSize: '15px' }}
                >
                  🔄 REPLAY CLUES
                </button>
                {activeQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary btn-lg"
                    style={{
                      padding: '14px 36px',
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    }}
                  >
                    ⏭️ NEXT CHALLENGE ({activeQuestionIndex + 2}/{questions.length})
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveQuestion(0)}
                    className="btn btn-primary btn-lg"
                    style={{ padding: '14px 36px', fontSize: '16px' }}
                  >
                    🎉 RESTART FROM CHALLENGE 1
                  </button>
                )}
              </div>
            )}

            {/* Subtext info */}
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <span>
                <strong>Progress:</strong> Clue {revealedClueCount} / 4
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ color: 'var(--accent-cyan)' }}>
                [Space] or [→] Next Clue &bull; [B] Toggle Buzzer Side List &bull; [F] Fullscreen
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SIDEBAR: BUZZER-PRESSED USER LIST                          */}
        {/*    Remains HIDDEN until the button is pressed               */}
        {/* ============================================================ */}
        {showBuzzerList && (
          <aside
            className="glass-card buzzer-side-drawer"
            style={{
              width: '380px',
              minWidth: '340px',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              background: 'linear-gradient(180deg, #111827 0%, #0B101C 100%)',
              border: '2px solid rgba(251, 191, 36, 0.45)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.65)',
              borderRadius: '20px',
            }}
          >
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 900,
                  color: 'var(--winner-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>🏆</span> BUZZER STANDINGS
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {queue.length} {queue.length === 1 ? 'Team Buzzed' : 'Teams Buzzed'}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowBuzzerList(false)}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  borderRadius: '10px',
                }}
                title="Hide Buzzer List"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Buzzer Actions Inside Drawer */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
            }}>
              {isActive ? (
                <button
                  onClick={lockRound}
                  className="btn btn-warning btn-sm"
                  style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
                >
                  🔒 Lock Buzzer
                </button>
              ) : (
                <button
                  onClick={startRound}
                  className="btn btn-success btn-sm pulsing-green"
                  style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
                >
                  ⚡ Unlock Buzzer
                </button>
              )}

              {queue.length > 0 && (
                <button
                  onClick={resetBuzzer}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  title="Clear buzzer pressed queue"
                >
                  🔄 Clear
                </button>
              )}
            </div>

            {/* The Live Buzzed List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '4px',
            }}>
              {queue.length === 0 ? (
                <div style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚡</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF', marginBottom: '6px' }}>
                    Waiting for Buzzers
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                    Teams can hit their buzzer button now. The first press will appear here instantly at 0ms.
                  </div>
                </div>
              ) : (
                queue.map((entry, idx) => {
                  const isFirst = entry.rank === 1;

                  return (
                    <div
                      key={entry.participantId || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isFirst
                          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isFirst
                          ? '1.8px solid var(--winner-gold)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isFirst
                          ? '0 0 20px rgba(251, 191, 36, 0.3)'
                          : 'none',
                        animation: 'fadeIn 0.25s ease',
                      }}
                    >
                      {/* Rank Position */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: '13px',
                        color: isFirst ? '#000000' : '#FFFFFF',
                        background: isFirst ? 'var(--winner-gold)' : 'rgba(255, 255, 255, 0.1)',
                        marginRight: '12px',
                        flexShrink: 0,
                      }}>
                        #{entry.rank}
                      </div>

                      {/* Team Name & Offset */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 800,
                          fontSize: '14px',
                          color: isFirst ? '#FFFFFF' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isFirst ? 'var(--winner-gold)' : 'var(--text-muted)',
                          marginTop: '2px',
                        }}>
                          {isFirst ? '🥇 1st Place (0 ms)' : `+${entry.timeOffsetMs} ms behind #1`}
                        </div>
                      </div>

                      {/* Winner Icon */}
                      {isFirst && (
                        <span style={{ fontSize: '18px', marginLeft: '6px' }}>👑</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ─── FULLSCREEN CLUE IMAGE LIGHTBOX OVERLAY ─── */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 99999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.25s ease',
            cursor: 'zoom-out',
          }}
        >
          {/* Lightbox Top Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '72px',
              padding: '0 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(11, 17, 32, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 4px 25px rgba(0, 0, 0, 0.5)',
              zIndex: 30,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', maxWidth: 'calc(100% - 240px)' }}>
              <span className="pill pill-blue" style={{ fontSize: '13px', padding: '6px 16px', fontWeight: 900, flexShrink: 0 }}>
                CLUE #{fullscreenImage.clueNumber} IMAGE
              </span>
              <span style={{
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {fullscreenImage.clueText}
              </span>
            </div>

            <button
              onClick={() => setFullscreenImage(null)}
              className="btn btn-secondary"
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 900,
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              ✕ Exit Fullscreen (Esc)
            </button>
          </div>

          {/* Full Resolution Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: '55px',
              maxWidth: '92vw',
              maxHeight: 'calc(100vh - 140px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '3px solid rgba(56, 189, 248, 0.75)',
              boxShadow: '0 0 70px rgba(56, 189, 248, 0.35), 0 30px 90px rgba(0, 0, 0, 0.95)',
              background: '#0B1120',
            }}
          >
            <img
              src={fullscreenImage.url}
              alt={`Clue #${fullscreenImage.clueNumber} Fullscreen`}
              style={{
                maxWidth: '92vw',
                maxHeight: 'calc(100vh - 140px)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '18px',
            fontSize: '12.5px',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}>
            Click anywhere or press [Esc] to exit image view
          </div>
        </div>
      )}
    </div>
  );
};
